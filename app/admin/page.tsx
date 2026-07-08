"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AdminMessage = {
  id: string;
  role: string;
  text: string;
  created_at: string | null;
};

type AdminConversation = {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  messages: AdminMessage[];
};

type AdminUser = {
  id: string;
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  conversationCount: number;
  messageCount: number;
  estimatedMinutesSpent: number;
  conversations: AdminConversation[];
};

type DailyTraffic = {
  label: string;
  messages: number;
  newUsers: number;
};

type TopUserByTime = {
  email: string;
  estimatedMinutesSpent: number;
  messageCount: number;
};

type AdminOverview = {
  currentAdmin: string;
  totals: {
    users: number;
    conversations: number;
    messages: number;
    estimatedMinutesSpent: number;
  };
  recent: {
    newUsers24h: number;
    newUsers7d: number;
    newUsers30d: number;
    messages24h: number;
    messages7d: number;
    messages30d: number;
    newUsers24hList: {
      id: string;
      email: string;
      createdAt: string | null;
    }[];
    newUsers7dList: {
      id: string;
      email: string;
      createdAt: string | null;
    }[];
    newUsers30dList: {
      id: string;
      email: string;
      createdAt: string | null;
    }[];
  };
  charts: {
    dailyTraffic: DailyTraffic[];
    topUsersByTime: TopUserByTime[];
  };
  users: AdminUser[];
};

const ALPINE = "#183b32";
const ALPINE_SOFT = "#2f5b4d";
const ROSE = "#d46b94";
const CREAM = "#f4efe4";
const SAGE = "#8fb59c";

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimeSpent(minutes: number) {
  if (!minutes) return "0 min";
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) return `${hours}h`;

  return `${hours}h ${remainingMinutes}m`;
}

function getMaxValue(values: number[]) {
  return Math.max(...values, 1);
}

function getActivityScore(user: AdminUser) {
  return (
    user.messageCount * 2 +
    user.conversationCount * 5 +
    user.estimatedMinutesSpent
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AdminOverview | null>(
    null
  );
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedConversationId, setSelectedConversationId] =
    useState("");
  const [recentFilter, setRecentFilter] = useState<
    "24h" | "7d" | "30d"
  >("24h");
  const [userFilter, setUserFilter] = useState<
    "all" | "active" | "new"
  >("all");

  useEffect(() => {
    async function loadAdminOverview() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setError("Please sign in with your admin account first.");
          setLoading(false);
          return;
        }

        const response = await fetch("/api/admin/overview", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Admin request failed.");
        }

        setOverview(data);

        const firstUser = data.users?.[0];

        if (firstUser) {
          setSelectedUserId(firstUser.id);
          setSelectedConversationId(
            firstUser.conversations?.[0]?.id || ""
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong.";

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadAdminOverview();
  }, []);

  const selectedUser = useMemo(() => {
    return overview?.users.find(
      (user) => user.id === selectedUserId
    );
  }, [overview, selectedUserId]);

  const selectedConversation = useMemo(() => {
    return selectedUser?.conversations.find(
      (conversation) => conversation.id === selectedConversationId
    );
  }, [selectedUser, selectedConversationId]);

  const recentUsers = useMemo(() => {
    if (!overview) return [];

    if (recentFilter === "24h") {
      return overview.recent.newUsers24hList;
    }

    if (recentFilter === "7d") {
      return overview.recent.newUsers7dList;
    }

    return overview.recent.newUsers30dList;
  }, [overview, recentFilter]);

  const filteredUsers = useMemo(() => {
    if (!overview) return [];

    const users = [...overview.users];

    if (userFilter === "active") {
      return users
        .filter((user) => user.messageCount > 0)
        .sort((a, b) => getActivityScore(b) - getActivityScore(a));
    }

    if (userFilter === "new") {
      const recentIds = new Set(
        overview.recent.newUsers30dList.map((user) => user.id)
      );

      return users.filter((user) => recentIds.has(user.id));
    }

    return users.sort((a, b) => getActivityScore(b) - getActivityScore(a));
  }, [overview, userFilter]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!overview) return null;

  const maxTraffic = getMaxValue(
    overview.charts.dailyTraffic.flatMap((day) => [
      day.messages,
      day.newUsers,
    ])
  );

  const maxTopUserTime = getMaxValue(
    overview.charts.topUsersByTime.map(
      (user) => user.estimatedMinutesSpent
    )
  );

  const totalRecentUsers =
    overview.recent.newUsers24h +
    overview.recent.newUsers7d +
    overview.recent.newUsers30d;

  return (
    <main
  className="min-h-dvh w-full overflow-x-hidden bg-[#f4efe4] text-[#183b32]"
  style={{ color: ALPINE }}
>
      <LuxuryBackground />

      <div className="relative z-10 mx-auto max-w-[1500px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <TopNav adminEmail={overview.currentAdmin} />

        <HeroSection overview={overview} />

        <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            index="01"
            label="Users"
            value={overview.totals.users}
            caption="Total registered accounts"
          />

          <MetricCard
            index="02"
            label="Conversations"
            value={overview.totals.conversations}
            caption="All saved conversation threads"
          />

          <MetricCard
            index="03"
            label="Messages"
            value={overview.totals.messages}
            caption="Human and assistant exchanges"
          />

          <MetricCard
            index="04"
            label="Time spent"
            value={formatTimeSpent(
              overview.totals.estimatedMinutesSpent
            )}
            caption="Estimated from message activity"
          />
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <TrafficStudio
            days={overview.charts.dailyTraffic}
            maxTraffic={maxTraffic}
          />

          <EngagementStudio
            users={overview.charts.topUsersByTime}
            maxTopUserTime={maxTopUserTime}
          />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <RecentPanel
            title="Past 24 hours"
            users={overview.recent.newUsers24h}
            messages={overview.recent.messages24h}
            accent="rose"
          />

          <RecentPanel
            title="Past week"
            users={overview.recent.newUsers7d}
            messages={overview.recent.messages7d}
            accent="sage"
          />

          <RecentPanel
            title="Past month"
            users={overview.recent.newUsers30d}
            messages={overview.recent.messages30d}
            accent="alpine"
          />
        </section>

        <section className="mt-5 rounded-[42px] border border-[#183b32]/10 bg-white/55 p-4 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.38em] text-[#d46b94]">
                Arrivals
              </p>

              <h2 className="mt-3 text-4xl font-black leading-none tracking-[-0.07em] sm:text-6xl">
                New user
                <br />
                movement.
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="max-w-md text-sm leading-6 text-[#183b32]/55">
                Quick view of new accounts across the most important
                admin windows.
              </p>

              <div className="grid grid-cols-3 rounded-full border border-[#183b32]/10 bg-[#183b32]/5 p-1 text-sm font-black">
                <button
                  onClick={() => setRecentFilter("24h")}
                  className={`rounded-full px-4 py-2 transition ${
                    recentFilter === "24h"
                      ? "bg-[#183b32] text-white"
                      : "text-[#183b32]/55 hover:text-[#183b32]"
                  }`}
                >
                  24h
                </button>

                <button
                  onClick={() => setRecentFilter("7d")}
                  className={`rounded-full px-4 py-2 transition ${
                    recentFilter === "7d"
                      ? "bg-[#183b32] text-white"
                      : "text-[#183b32]/55 hover:text-[#183b32]"
                  }`}
                >
                  7d
                </button>

                <button
                  onClick={() => setRecentFilter("30d")}
                  className={`rounded-full px-4 py-2 transition ${
                    recentFilter === "30d"
                      ? "bg-[#183b32] text-white"
                      : "text-[#183b32]/55 hover:text-[#183b32]"
                  }`}
                >
                  30d
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[32px] bg-[#183b32] p-5 text-white">
              <p className="text-5xl font-black tracking-[-0.08em]">
                {totalRecentUsers}
              </p>

              <p className="mt-3 text-xs font-black uppercase tracking-[0.25em] text-white/45">
                Combined recent signals
              </p>
            </div>

            {recentUsers.length === 0 && (
              <EmptyState text="No new users in this selected period." />
            )}

            {recentUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  const fullUser = overview.users.find(
                    (item) => item.id === user.id
                  );
                  setSelectedConversationId(
                    fullUser?.conversations?.[0]?.id || ""
                  );
                }}
                className="group rounded-[32px] border border-[#183b32]/10 bg-white/70 p-5 text-left transition hover:-translate-y-1 hover:bg-white"
              >
                <p className="truncate text-lg font-black tracking-[-0.03em]">
                  {user.email}
                </p>

                <p className="mt-3 text-sm text-[#183b32]/50">
                  Joined {formatDate(user.createdAt)}
                </p>

                <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#d46b94] opacity-0 transition group-hover:opacity-100">
                  Open profile
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 xl:grid-cols-[430px_1fr]">
          <UserDirectory
            users={filteredUsers}
            selectedUserId={selectedUserId}
            userFilter={userFilter}
            onFilterChange={setUserFilter}
            onSelectUser={(user) => {
              setSelectedUserId(user.id);
              setSelectedConversationId(
                user.conversations?.[0]?.id || ""
              );
            }}
          />

          <UserDetail
            user={selectedUser}
            selectedConversation={selectedConversation}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </section>

        <footer className="py-10 text-center text-xs font-black uppercase tracking-[0.35em] text-[#183b32]/35">
          Vibe admin intelligence · time spent is estimated from
          message activity
        </footer>
      </div>
    </main>
  );
}

function LuxuryBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(212,107,148,0.28),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(143,181,156,0.36),transparent_36%),linear-gradient(135deg,#f4efe4,#f7f1e8_45%,#edf3ec)]" />

      <div className="absolute left-0 top-0 h-px w-full bg-[#183b32]/10" />

      <div className="absolute left-[8%] top-[12%] h-[420px] w-[420px] rounded-full border border-[#183b32]/10" />

      <div className="absolute bottom-[5%] right-[7%] h-[520px] w-[520px] rounded-full border border-[#d46b94]/20" />

      <div className="absolute left-1/2 top-0 h-full w-px bg-[#183b32]/5" />
    </div>
  );
}

function LoadingState() {
  return (
    <main className="min-h-dvh bg-[#f4efe4] p-4 text-[#183b32] sm:p-6">
      <LuxuryBackground />

      <div className="relative z-10 mx-auto flex min-h-[82dvh] max-w-7xl items-center justify-center rounded-[48px] border border-[#183b32]/10 bg-white/55 p-8 shadow-[0_30px_100px_rgba(24,59,50,0.12)] backdrop-blur-2xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d46b94]">
            Vibe Control Room
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-[-0.08em] sm:text-7xl">
            Loading
            <br />
            intelligence.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[#183b32]/55">
            Preparing users, conversations, recent movement, and
            traffic signals.
          </p>

          <div className="mx-auto mt-8 h-2 w-56 overflow-hidden rounded-full bg-[#183b32]/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-[#d46b94]" />
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <main className="min-h-dvh bg-[#f4efe4] p-4 text-[#183b32] sm:p-6">
      <LuxuryBackground />

      <div className="relative z-10 mx-auto max-w-5xl rounded-[48px] border border-[#183b32]/10 bg-white/65 p-8 shadow-[0_30px_100px_rgba(24,59,50,0.12)] backdrop-blur-2xl">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d46b94]">
          Admin access
        </p>

        <h1 className="mt-5 text-5xl font-black tracking-[-0.08em] sm:text-7xl">
          Dashboard
          <br />
          unavailable.
        </h1>

        <p className="mt-5 rounded-[28px] border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </p>

        <a
          href="/"
          className="mt-8 inline-flex rounded-full bg-[#183b32] px-6 py-3 text-sm font-black text-white transition hover:bg-[#2f5b4d]"
        >
          Back to chat
        </a>
      </div>
    </main>
  );
}

function TopNav({ adminEmail }: { adminEmail: string }) {
  return (
    <nav className="mb-4 flex flex-col gap-3 rounded-full border border-[#183b32]/10 bg-white/55 px-4 py-3 shadow-[0_20px_60px_rgba(24,59,50,0.08)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#183b32] text-sm font-black text-white">
          V
        </div>

        <div>
          <p className="text-sm font-black leading-none">
            Vibe Admin
          </p>

          <p className="mt-1 max-w-[230px] truncate text-xs text-[#183b32]/50 sm:max-w-none">
            {adminEmail}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto text-xs font-black uppercase tracking-[0.22em] text-[#183b32]/45">
        <span>Users</span>
        <span className="h-1 w-1 rounded-full bg-[#d46b94]" />
        <span>Traffic</span>
        <span className="h-1 w-1 rounded-full bg-[#d46b94]" />
        <span>Engagement</span>
      </div>

      <a
        href="/"
        className="rounded-full bg-[#183b32] px-5 py-3 text-center text-xs font-black uppercase tracking-[0.2em] text-white transition hover:bg-[#2f5b4d]"
      >
        Back
      </a>
    </nav>
  );
}

function HeroSection({ overview }: { overview: AdminOverview }) {
  return (
    <header className="overflow-hidden rounded-[48px] border border-[#183b32]/10 bg-white/60 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl">
      <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.42em] text-[#d46b94]">
            Strategic App Intelligence
          </p>

          <h1 className="mt-6 max-w-5xl text-6xl font-black leading-[0.84] tracking-[-0.09em] sm:text-8xl lg:text-9xl">
            Million
            <br />
            dollar
            <br />
            control.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[#183b32]/58 sm:text-lg">
            A cinematic dashboard for monitoring user growth,
            engagement, conversations, and momentum inside Vibe.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <HeroPill label="Live admin overview" />
            <HeroPill label="No backend changes" />
            <HeroPill label="Luxury UI layer" />
          </div>
        </div>

        <div className="relative min-h-[420px] border-t border-[#183b32]/10 bg-[#183b32] p-6 text-white sm:p-8 xl:border-l xl:border-t-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,107,148,0.42),transparent_34%),radial-gradient(circle_at_20%_85%,rgba(143,181,156,0.38),transparent_36%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-white/45">
                Today’s command signal
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <HeroSignal
                  label="24h users"
                  value={overview.recent.newUsers24h}
                />

                <HeroSignal
                  label="24h messages"
                  value={overview.recent.messages24h}
                />

                <HeroSignal
                  label="7d users"
                  value={overview.recent.newUsers7d}
                />

                <HeroSignal
                  label="7d messages"
                  value={overview.recent.messages7d}
                />
              </div>
            </div>

            <div className="mt-8 rounded-[34px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
              <p className="text-sm leading-6 text-white/70">
                The admin dashboard reads from your existing
                admin API and transforms it into a premium
                operational cockpit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-[#183b32]/10 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#183b32]/60">
      {label}
    </span>
  );
}

function HeroSignal({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[30px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
      <p className="text-5xl font-black tracking-[-0.08em]">
        {value}
      </p>

      <p className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function MetricCard({
  index,
  label,
  value,
  caption,
}: {
  index: string;
  label: string;
  value: string | number;
  caption: string;
}) {
  return (
    <article className="group rounded-[40px] border border-[#183b32]/10 bg-white/60 p-5 shadow-[0_25px_70px_rgba(24,59,50,0.08)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:bg-white/80">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#183b32]/35">
          {index}
        </p>

        <div className="h-3 w-3 rounded-full bg-[#d46b94] transition group-hover:scale-125" />
      </div>

      <p className="mt-8 text-5xl font-black tracking-[-0.09em] sm:text-6xl">
        {value}
      </p>

      <p className="mt-4 text-lg font-black tracking-[-0.04em]">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-[#183b32]/50">
        {caption}
      </p>
    </article>
  );
}

function TrafficStudio({
  days,
  maxTraffic,
}: {
  days: DailyTraffic[];
  maxTraffic: number;
}) {
  return (
    <section className="rounded-[48px] border border-[#183b32]/10 bg-white/60 p-5 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl sm:p-6 lg:p-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d46b94]">
            Traffic studio
          </p>

          <h2 className="mt-4 text-5xl font-black leading-none tracking-[-0.08em] sm:text-6xl">
            Seven day
            <br />
            movement.
          </h2>
        </div>

        <p className="max-w-sm text-sm leading-6 text-[#183b32]/55">
          A refined signal view of message volume and new user
          movement across the last week.
        </p>
      </div>

      <div className="mt-8 grid min-h-[360px] grid-cols-7 items-end gap-2 rounded-[34px] border border-[#183b32]/10 bg-[#f8f4eb]/70 p-4 sm:gap-4 sm:p-6">
        {days.map((day) => (
          <div
            key={day.label}
            className="flex h-full min-h-[300px] flex-col justify-end gap-3"
          >
            <div className="flex flex-1 items-end gap-1 sm:gap-2">
              <VerticalBar
                value={day.messages}
                max={maxTraffic}
                tone="rose"
              />

              <VerticalBar
                value={day.newUsers}
                max={maxTraffic}
                tone="sage"
              />
            </div>

            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#183b32]/45">
                {day.label}
              </p>

              <p className="mt-1 text-[10px] text-[#183b32]/35">
                {day.messages}/{day.newUsers}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <LegendDot label="Messages" color="rose" />
        <LegendDot label="New users" color="sage" />
      </div>
    </section>
  );
}

function VerticalBar({
  value,
  max,
  tone,
}: {
  value: number;
  max: number;
  tone: "rose" | "sage";
}) {
  const height = `${Math.max((value / max) * 100, value > 0 ? 8 : 2)}%`;

  return (
    <div className="flex h-full flex-1 items-end overflow-hidden rounded-full bg-[#183b32]/8">
      <div
        className={`w-full rounded-full transition-all duration-700 ${
          tone === "rose" ? "bg-[#d46b94]" : "bg-[#8fb59c]"
        }`}
        style={{ height }}
        title={`${value}`}
      />
    </div>
  );
}

function LegendDot({
  label,
  color,
}: {
  label: string;
  color: "rose" | "sage";
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[#183b32]/50">
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          color === "rose" ? "bg-[#d46b94]" : "bg-[#8fb59c]"
        }`}
      />
      {label}
    </div>
  );
}

function EngagementStudio({
  users,
  maxTopUserTime,
}: {
  users: TopUserByTime[];
  maxTopUserTime: number;
}) {
  return (
    <section className="rounded-[48px] border border-[#183b32]/10 bg-[#183b32] p-5 text-white shadow-[0_30px_100px_rgba(24,59,50,0.18)] backdrop-blur-2xl sm:p-6 lg:p-8">
      <p className="text-xs font-black uppercase tracking-[0.4em] text-[#f2b9cf]">
        Engagement
      </p>

      <h2 className="mt-4 text-5xl font-black leading-none tracking-[-0.08em] sm:text-6xl">
        Time
        <br />
        leaders.
      </h2>

      <p className="mt-5 text-sm leading-6 text-white/50">
        Estimated from message activity. This is useful for trend
        awareness, not exact screen-time tracking.
      </p>

      <div className="mt-8 space-y-5">
        {users.length === 0 && (
          <div className="rounded-[32px] border border-white/10 bg-white/10 p-5 text-sm text-white/50">
            No activity yet.
          </div>
        )}

        {users.map((user, index) => {
          const width = `${Math.max(
            (user.estimatedMinutesSpent / maxTopUserTime) * 100,
            user.estimatedMinutesSpent > 0 ? 8 : 0
          )}%`;

          return (
            <div
              key={`${user.email}-${index}`}
              className="rounded-[30px] border border-white/10 bg-white/10 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">
                    {user.email}
                  </p>

                  <p className="mt-1 text-xs text-white/45">
                    {user.messageCount} messages
                  </p>
                </div>

                <p className="shrink-0 text-sm font-black text-[#f2b9cf]">
                  {formatTimeSpent(user.estimatedMinutesSpent)}
                </p>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#f2b9cf]"
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentPanel({
  title,
  users,
  messages,
  accent,
}: {
  title: string;
  users: number;
  messages: number;
  accent: "rose" | "sage" | "alpine";
}) {
  const accentClass =
    accent === "rose"
      ? "bg-[#d46b94]"
      : accent === "sage"
        ? "bg-[#8fb59c]"
        : "bg-[#183b32]";

  return (
    <article className="rounded-[40px] border border-[#183b32]/10 bg-white/60 p-5 shadow-[0_25px_70px_rgba(24,59,50,0.08)] backdrop-blur-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black tracking-[-0.02em]">
          {title}
        </p>

        <span className={`h-3 w-3 rounded-full ${accentClass}`} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[30px] bg-[#183b32] p-5 text-white">
          <p className="text-5xl font-black tracking-[-0.08em]">
            {users}
          </p>

          <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-white/45">
            Users
          </p>
        </div>

        <div className="rounded-[30px] bg-[#f2b9cf]/70 p-5 text-[#183b32]">
          <p className="text-5xl font-black tracking-[-0.08em]">
            {messages}
          </p>

          <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-[#183b32]/45">
            Messages
          </p>
        </div>
      </div>
    </article>
  );
}

function UserDirectory({
  users,
  selectedUserId,
  userFilter,
  onFilterChange,
  onSelectUser,
}: {
  users: AdminUser[];
  selectedUserId: string;
  userFilter: "all" | "active" | "new";
  onFilterChange: (value: "all" | "active" | "new") => void;
  onSelectUser: (user: AdminUser) => void;
}) {
  return (
    <aside className="rounded-[48px] border border-[#183b32]/10 bg-white/60 p-5 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl sm:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-[#d46b94]">
          Directory
        </p>

        <h2 className="mt-4 text-5xl font-black leading-none tracking-[-0.08em]">
          User
          <br />
          archive.
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-3 rounded-full border border-[#183b32]/10 bg-[#183b32]/5 p-1 text-xs font-black uppercase tracking-[0.15em]">
        <button
          onClick={() => onFilterChange("all")}
          className={`rounded-full px-3 py-2 transition ${
            userFilter === "all"
              ? "bg-[#183b32] text-white"
              : "text-[#183b32]/50 hover:text-[#183b32]"
          }`}
        >
          All
        </button>

        <button
          onClick={() => onFilterChange("active")}
          className={`rounded-full px-3 py-2 transition ${
            userFilter === "active"
              ? "bg-[#183b32] text-white"
              : "text-[#183b32]/50 hover:text-[#183b32]"
          }`}
        >
          Active
        </button>

        <button
          onClick={() => onFilterChange("new")}
          className={`rounded-full px-3 py-2 transition ${
            userFilter === "new"
              ? "bg-[#183b32] text-white"
              : "text-[#183b32]/50 hover:text-[#183b32]"
          }`}
        >
          New
        </button>
      </div>

      <div className="mt-6 max-h-[780px] space-y-3 overflow-y-auto pr-1">
        {users.length === 0 && (
          <EmptyState text="No users found for this filter." />
        )}

        {users.map((user, index) => (
          <button
            key={user.id}
            onClick={() => onSelectUser(user)}
            className={`group w-full rounded-[34px] border p-4 text-left transition duration-300 ${
              selectedUserId === user.id
                ? "border-[#d46b94]/50 bg-[#fde8f1]"
                : "border-[#183b32]/10 bg-white/65 hover:-translate-y-0.5 hover:bg-white"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-black tracking-[-0.03em]">
                  {user.email}
                </p>

                <p className="mt-2 text-sm text-[#183b32]/55">
                  {user.conversationCount} conversations ·{" "}
                  {user.messageCount} messages
                </p>

                <p className="mt-1 text-sm text-[#183b32]/45">
                  {formatTimeSpent(user.estimatedMinutesSpent)}
                </p>
              </div>

              <span className="rounded-full bg-[#183b32]/8 px-3 py-1 text-xs font-black text-[#183b32]/50">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-[#183b32]/8">
              <div
                className="h-full rounded-full bg-[#d46b94]"
                style={{
                  width: `${Math.min(
                    getActivityScore(user),
                    100
                  )}%`,
                }}
              />
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}

function UserDetail({
  user,
  selectedConversation,
  selectedConversationId,
  onSelectConversation,
}: {
  user: AdminUser | undefined;
  selectedConversation: AdminConversation | undefined;
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
}) {
  if (!user) {
    return (
      <section className="min-w-0 overflow-hidden rounded-[48px] border border-[#183b32]/10 bg-white/60 p-6 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl">
        <EmptyState text="Select a user to inspect their profile, conversations, and messages." />
      </section>
    );
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[48px] border border-[#183b32]/10 bg-white/60 p-4 shadow-[0_30px_100px_rgba(24,59,50,0.10)] backdrop-blur-2xl sm:p-6">
      <div className="grid min-w-0 gap-5 2xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 rounded-[38px] bg-[#183b32] p-5 text-white sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.4em] text-[#f2b9cf]">
            User profile
          </p>

          <h2 className="mt-4 max-w-full break-words text-3xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
            {user.email}
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <DarkMiniInfo
              label="Joined"
              value={formatShortDate(user.createdAt)}
            />

            <DarkMiniInfo
              label="Last sign in"
              value={formatShortDate(user.lastSignInAt)}
            />

            <DarkMiniInfo
              label="Time spent"
              value={formatTimeSpent(user.estimatedMinutesSpent)}
            />
          </div>
        </div>

        <div className="min-w-0 rounded-[38px] border border-[#183b32]/10 bg-[#f8f4eb]/70 p-5">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#183b32]/40">
            Snapshot
          </p>

          <div className="mt-5 space-y-3">
            <SnapshotRow
              label="Conversations"
              value={user.conversationCount}
            />

            <SnapshotRow label="Messages" value={user.messageCount} />

            <SnapshotRow
              label="Estimated minutes"
              value={user.estimatedMinutesSpent}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-5 2xl:grid-cols-[330px_1fr]">
        <div className="min-w-0 rounded-[38px] border border-[#183b32]/10 bg-[#f8f4eb]/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black tracking-[-0.05em]">
              Conversations
            </h3>

            <span className="rounded-full bg-[#183b32] px-3 py-1 text-xs font-black text-white">
              {user.conversations.length}
            </span>
          </div>

          <div className="mt-4 max-h-[600px] space-y-2 overflow-y-auto pr-1">
            {user.conversations.length === 0 && (
              <EmptyState text="No conversations yet." />
            )}

            {user.conversations.map((conversation, index) => (
              <button
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full rounded-[28px] border p-4 text-left transition ${
                  selectedConversationId === conversation.id
                    ? "border-[#d46b94]/50 bg-[#fde8f1]"
                    : "border-[#183b32]/10 bg-white/70 hover:bg-white"
                }`}
              >
                <p className="font-black">Conversation {index + 1}</p>

                <p className="mt-2 text-sm text-[#183b32]/55">
                  {conversation.messages.length} messages
                </p>

                <p className="mt-1 text-xs text-[#183b32]/35">
                  {formatDate(conversation.updated_at)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 rounded-[38px] border border-[#183b32]/10 bg-[#f8f4eb]/70 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-black tracking-[-0.05em]">
              Message reel
            </h3>

            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#183b32]/40">
              Conversation detail
            </p>
          </div>

          <div className="mt-4 max-h-[600px] max-w-full space-y-3 overflow-y-auto overflow-x-hidden rounded-[30px] border border-[#183b32]/10 bg-white/55 p-3">
            {!selectedConversation && (
              <EmptyState text="Select a conversation to view messages." />
            )}

            {selectedConversation?.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DarkMiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>

      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function SnapshotRow({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[24px] bg-white/70 px-4 py-3">
      <span className="text-sm font-bold text-[#183b32]/55">
        {label}
      </span>

      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function MessageBubble({ message }: { message: AdminMessage }) {
  const isUser = message.role === "user";

  return (
    <article
      className={`rounded-[30px] p-4 ${
        isUser ? "bg-[#fde8f1]" : "bg-[#e7f1ea]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-[#183b32]/45">
          {message.role}
        </p>

        <p className="text-xs font-semibold text-[#183b32]/35">
          {formatDate(message.created_at)}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#183b32]/85">
        {message.text}
      </p>
    </article>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[30px] border border-[#183b32]/10 bg-white/55 p-5 text-sm font-semibold leading-6 text-[#183b32]/50">
      {text}
    </div>
  );
}