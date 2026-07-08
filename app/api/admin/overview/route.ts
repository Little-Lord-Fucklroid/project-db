import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAILS = ["urbanenterprise63@gmail.com"];

type DbConversation = {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
};

type DbMessage = {
  id: string;
  user_id: string;
  conversation_id: string;
  role: string;
  text: string;
  created_at: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isAfter(value: string | null | undefined, cutoff: Date) {
  if (!value) return false;
  return new Date(value).getTime() >= cutoff.getTime();
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function estimateTimeSpentMinutes(messages: DbMessage[]) {
  const times = messages
    .map((message) =>
      message.created_at
        ? new Date(message.created_at).getTime()
        : 0
    )
    .filter(Boolean)
    .sort((a, b) => a - b);

  if (times.length === 0) {
    return 0;
  }

  const maxGapMs = 15 * 60 * 1000;
  const minSessionMs = 2 * 60 * 1000;

  let totalMs = 0;
  let sessionStart = times[0];
  let previous = times[0];

  for (let i = 1; i < times.length; i++) {
    const current = times[i];
    const gap = current - previous;

    if (gap > maxGapMs) {
      totalMs += Math.max(previous - sessionStart, minSessionMs);
      sessionStart = current;
    }

    previous = current;
  }

  totalMs += Math.max(previous - sessionStart, minSessionMs);

  return Math.round(totalMs / 60000);
}

function buildDailyTraffic(messages: DbMessage[], users: { created_at?: string }[]) {
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const messagesOnDay = messages.filter((message) => {
      if (!message.created_at) return false;

      const time = new Date(message.created_at).getTime();

      return (
        time >= date.getTime() &&
        time < nextDate.getTime()
      );
    });

    const usersOnDay = users.filter((user) => {
      if (!user.created_at) return false;

      const time = new Date(user.created_at).getTime();

      return (
        time >= date.getTime() &&
        time < nextDate.getTime()
      );
    });

    return {
      label: getDayLabel(date),
      messages: messagesOnDay.length,
      newUsers: usersOnDay.length,
    };
  });

  return days;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return Response.json(
        { error: "Not signed in." },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return Response.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const adminEmail = user.email || "";

    if (!ADMIN_EMAILS.includes(adminEmail)) {
      return Response.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const now = new Date();

    const last24Hours = new Date(now);
    last24Hours.setHours(now.getHours() - 24);

    const last7Days = new Date(now);
    last7Days.setDate(now.getDate() - 7);

    const last30Days = new Date(now);
    last30Days.setDate(now.getDate() - 30);

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      throw new Error(usersError.message);
    }

    const { data: conversations, error: conversationsError } =
      await supabaseAdmin
        .from("conversations")
        .select("id,user_id,created_at,updated_at")
        .order("updated_at", { ascending: false });

    if (conversationsError) {
      throw new Error(conversationsError.message);
    }

    const { data: messages, error: messagesError } =
      await supabaseAdmin
        .from("messages")
        .select("id,user_id,conversation_id,role,text,created_at")
        .order("created_at", { ascending: true })
        .limit(10000);

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    const safeConversations =
      (conversations || []) as DbConversation[];

    const safeMessages = (messages || []) as DbMessage[];

    const users = usersData.users.map((userItem) => {
      const userConversations = safeConversations.filter(
        (conversation) => conversation.user_id === userItem.id
      );

      const userMessages = safeMessages.filter(
        (message) => message.user_id === userItem.id
      );

      return {
        id: userItem.id,
        email: userItem.email || "No email",
        createdAt: userItem.created_at,
        lastSignInAt: userItem.last_sign_in_at,
        conversationCount: userConversations.length,
        messageCount: userMessages.length,
        estimatedMinutesSpent:
          estimateTimeSpentMinutes(userMessages),
        conversations: userConversations.map((conversation) => ({
          ...conversation,
          messages: safeMessages.filter(
            (message) =>
              message.conversation_id === conversation.id
          ),
        })),
      };
    });

    const newUsers24h = usersData.users.filter((userItem) =>
      isAfter(userItem.created_at, last24Hours)
    );

    const newUsers7d = usersData.users.filter((userItem) =>
      isAfter(userItem.created_at, last7Days)
    );

    const newUsers30d = usersData.users.filter((userItem) =>
      isAfter(userItem.created_at, last30Days)
    );

    const messages24h = safeMessages.filter((message) =>
      isAfter(message.created_at, last24Hours)
    );

    const messages7d = safeMessages.filter((message) =>
      isAfter(message.created_at, last7Days)
    );

    const messages30d = safeMessages.filter((message) =>
      isAfter(message.created_at, last30Days)
    );

    const totalEstimatedMinutesSpent = users.reduce(
      (total, userItem) =>
        total + userItem.estimatedMinutesSpent,
      0
    );

    const dailyTraffic = buildDailyTraffic(
      safeMessages,
      usersData.users
    );

    const topUsersByTime = [...users]
      .sort(
        (a, b) =>
          b.estimatedMinutesSpent -
          a.estimatedMinutesSpent
      )
      .slice(0, 5)
      .map((userItem) => ({
        email: userItem.email,
        estimatedMinutesSpent:
          userItem.estimatedMinutesSpent,
        messageCount: userItem.messageCount,
      }));

    return Response.json({
      currentAdmin: adminEmail,

      totals: {
        users: users.length,
        conversations: safeConversations.length,
        messages: safeMessages.length,
        estimatedMinutesSpent: totalEstimatedMinutesSpent,
      },

      recent: {
        newUsers24h: newUsers24h.length,
        newUsers7d: newUsers7d.length,
        newUsers30d: newUsers30d.length,

        messages24h: messages24h.length,
        messages7d: messages7d.length,
        messages30d: messages30d.length,

        newUsers24hList: newUsers24h.map((userItem) => ({
          id: userItem.id,
          email: userItem.email || "No email",
          createdAt: userItem.created_at,
        })),

        newUsers7dList: newUsers7d.map((userItem) => ({
          id: userItem.id,
          email: userItem.email || "No email",
          createdAt: userItem.created_at,
        })),

        newUsers30dList: newUsers30d.map((userItem) => ({
          id: userItem.id,
          email: userItem.email || "No email",
          createdAt: userItem.created_at,
        })),
      },

      charts: {
        dailyTraffic,
        topUsersByTime,
      },

      users,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Admin overview failed.";

    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}