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

    return Response.json({
      currentAdmin: adminEmail,
      totalUsers: users.length,
      totalConversations: safeConversations.length,
      totalMessages: safeMessages.length,
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