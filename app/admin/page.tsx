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

const INK = "#1f3d34";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
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

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedConversationId, setSelectedConversationId] =
    useState("");
  const [recentFilter, setRecentFilter] = useState<
    "24h" | "7d" | "30d"
  >("24h");

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

  if (loading) {
    return (
      <main
        className="min-h-dvh bg-[#f4f0e6] p-5"
        style={{ color: INK }}
      >
        <div className="mx-auto flex min-h-[70dvh] max-w-7xl items-center justify-center rounded-[40px] border border-[#1f3d34]/10 bg-white/55 p-8 backdrop-blur-xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d45f8f]">
              Vibe Admin
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em]">
              Loading dashboard
            </h1>

            <p className="mt-3 text-sm text-[#1f3d34]/55">
              Preparing users, conversations, and traffic data.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-dvh bg-[#f4f0e6] p-5"
        style={{ color: INK }}
      >
        <div className="mx-auto max-w-5xl rounded-[40px] border border-[#1f3d34]/10 bg-white/70 p-8 backdrop-blur-xl">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#d45f8f]">
            Admin access
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em]">
            Dashboard unavailable
          </h1>

          <p className="mt-4 text-red-600">{error}</p>

          <a
            href="/"
            className="mt-8 inline-flex rounded-full bg-[#1f3d34] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2f594b]"
          >
            Back to chat
          </a>
        </div>
      </main>
    );
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

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-[#f4f0e6]"
      style={{ color: INK }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-80">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-[#f0b6ce] blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-[#b8d8c4] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        <header className="rounded-[40px] border border-[#1f3d34]/10 bg-white/60 p-5 backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d45f8f]">
                Vibe Control Room
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.08em] sm:text-7xl lg:text-8xl">
                Admin
                <br />
                Intelligence.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-[#1f3d34]/60">
                A live operational view of users, conversations,
                engagement, and recent app activity.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[28px] border border-[#1f3d34]/10 bg-[#1f3d34] p-4 text-white sm:min-w-[300px]">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">
                Signed in as
              </p>

              <p className="truncate text-sm font-semibold">
                {overview.currentAdmin}
              </p>

              <a
                href="/"
                className="mt-2 rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-[#1f3d34] transition hover:bg-[#f0b6ce]"
              >
                Back to chat
              </a>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            eyebrow="Total"
            label="Users"
            value={overview.totals.users}
          />

          <MetricCard
            eyebrow="Total"
            label="Conversations"
            value={overview.totals.conversations}
          />

          <MetricCard
            eyebrow="Total"
            label="Messages"
            value={overview.totals.messages}
          />

          <MetricCard
            eyebrow="Estimated"
            label="Time spent"
            value={formatTimeSpent(
              overview.totals.estimatedMinutesSpent
            )}
          />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <RecentPanel
            title="Past 24h"
            users={overview.recent.newUsers24h}
            messages={overview.recent.messages24h}
          />

          <RecentPanel
            title="Past week"
            users={overview.recent.newUsers7d}
            messages={overview.recent.messages7d}
          />

          <RecentPanel
            title="Past month"
            users={overview.recent.newUsers30d}
            messages={overview.recent.messages30d}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[40px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d45f8f]">
                  Traffic
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                  Last 7 days
                </h2>
              </div>

              <p className="max-w-sm text-sm text-[#1f3d34]/55">
                Message volume and new user activity, grouped by day.
              </p>
            </div>

            <div className="mt-8 space-y-5">
              {overview.charts.dailyTraffic.map((day) => (
                <div key={day.label}>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#1f3d34]/45">
                    <span>{day.label}</span>
                    <span>
                      {day.messages} msgs · {day.newUsers} users
                    </span>
                  </div>

                  <div className="grid gap-2">
                    <TrafficBar
                      value={day.messages}
                      max={maxTraffic}
                      label="Messages"
                      tone="rose"
                    />

                    <TrafficBar
                      value={day.newUsers}
                      max={maxTraffic}
                      label="New users"
                      tone="sage"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[40px] border border-[#1f3d34]/10 bg-[#1f3d34] p-5 text-white backdrop-blur-2xl sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#f0b6ce]">
              Engagement
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
              Top time spent
            </h2>

            <p className="mt-2 text-sm text-white/50">
              Estimated from message activity.
            </p>

            <div className="mt-8 space-y-5">
              {overview.charts.topUsersByTime.length === 0 && (
                <p className="text-sm text-white/50">
                  No activity yet.
                </p>
              )}

              {overview.charts.topUsersByTime.map((user, index) => (
                <div key={`${user.email}-${index}`}>
                  <div className="mb-2 flex justify-between gap-3 text-xs">
                    <span className="truncate text-white/75">
                      {user.email}
                    </span>

                    <span className="shrink-0 font-bold">
                      {formatTimeSpent(
                        user.estimatedMinutesSpent
                      )}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#f0b6ce]"
                      style={{
                        width: `${Math.max(
                          (user.estimatedMinutesSpent /
                            maxTopUserTime) *
                            100,
                          user.estimatedMinutesSpent > 0 ? 8 : 0
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[40px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d45f8f]">
                New users
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
                Recent arrivals
              </h2>
            </div>

            <div className="grid grid-cols-3 rounded-full bg-[#1f3d34]/8 p-1 text-sm font-bold">
              <button
                onClick={() => setRecentFilter("24h")}
                className={`rounded-full px-4 py-2 transition ${
                  recentFilter === "24h"
                    ? "bg-[#1f3d34] text-white"
                    : "text-[#1f3d34]/55 hover:text-[#1f3d34]"
                }`}
              >
                24h
              </button>

              <button
                onClick={() => setRecentFilter("7d")}
                className={`rounded-full px-4 py-2 transition ${
                  recentFilter === "7d"
                    ? "bg-[#1f3d34] text-white"
                    : "text-[#1f3d34]/55 hover:text-[#1f3d34]"
                }`}
              >
                7d
              </button>

              <button
                onClick={() => setRecentFilter("30d")}
                className={`rounded-full px-4 py-2 transition ${
                  recentFilter === "30d"
                    ? "bg-[#1f3d34] text-white"
                    : "text-[#1f3d34]/55 hover:text-[#1f3d34]"
                }`}
              >
                30d
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-[#1f3d34]/55">
                No new users in this period.
              </p>
            )}

            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-[28px] border border-[#1f3d34]/10 bg-white/65 p-4"
              >
                <p className="truncate font-bold">{user.email}</p>

                <p className="mt-2 text-sm text-[#1f3d34]/45">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[390px_1fr]">
          <aside className="rounded-[40px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d45f8f]">
              Directory
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-[-0.06em]">
              Users
            </h2>

            <div className="mt-6 max-h-[740px] space-y-3 overflow-y-auto pr-1">
              {overview.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSelectedConversationId(
                      user.conversations?.[0]?.id || ""
                    );
                  }}
                  className={`w-full rounded-[28px] border p-4 text-left transition ${
                    selectedUserId === user.id
                      ? "border-[#d45f8f]/40 bg-[#fde8f1]"
                      : "border-[#1f3d34]/10 bg-white/60 hover:bg-white"
                  }`}
                >
                  <p className="truncate font-black">
                    {user.email}
                  </p>

                  <p className="mt-2 text-sm text-[#1f3d34]/55">
                    {user.conversationCount} conversations ·{" "}
                    {user.messageCount} messages
                  </p>

                  <p className="mt-1 text-sm text-[#1f3d34]/45">
                    {formatTimeSpent(user.estimatedMinutesSpent)}
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[40px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl">
            {!selectedUser ? (
              <p className="text-[#1f3d34]/55">Select a user.</p>
            ) : (
              <>
                <div className="border-b border-[#1f3d34]/10 pb-5">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d45f8f]">
                    User profile
                  </p>

                  <h2 className="mt-2 truncate text-3xl font-black tracking-[-0.06em]">
                    {selectedUser.email}
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniInfo
                      label="Joined"
                      value={formatDate(selectedUser.createdAt)}
                    />

                    <MiniInfo
                      label="Last sign in"
                      value={formatDate(
                        selectedUser.lastSignInAt
                      )}
                    />

                    <MiniInfo
                      label="Time spent"
                      value={formatTimeSpent(
                        selectedUser.estimatedMinutesSpent
                      )}
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
                  <div>
                    <h3 className="text-lg font-black">
                      Conversations
                    </h3>

                    <div className="mt-3 max-h-[580px] space-y-2 overflow-y-auto pr-1">
                      {selectedUser.conversations.length === 0 && (
                        <p className="text-sm text-[#1f3d34]/55">
                          No conversations yet.
                        </p>
                      )}

                      {selectedUser.conversations.map(
                        (conversation, index) => (
                          <button
                            key={conversation.id}
                            onClick={() =>
                              setSelectedConversationId(
                                conversation.id
                              )
                            }
                            className={`w-full rounded-[24px] border p-3 text-left text-sm transition ${
                              selectedConversationId ===
                              conversation.id
                                ? "border-[#d45f8f]/40 bg-[#fde8f1]"
                                : "border-[#1f3d34]/10 bg-white/60 hover:bg-white"
                            }`}
                          >
                            <p className="font-black">
                              Conversation {index + 1}
                            </p>

                            <p className="mt-1 text-[#1f3d34]/55">
                              {conversation.messages.length} messages
                            </p>

                            <p className="mt-1 text-xs text-[#1f3d34]/35">
                              {formatDate(conversation.updated_at)}
                            </p>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-black">Messages</h3>

                    <div className="mt-3 max-h-[580px] space-y-3 overflow-y-auto rounded-[28px] border border-[#1f3d34]/10 bg-white/50 p-3">
                      {!selectedConversation && (
                        <p className="text-sm text-[#1f3d34]/55">
                          Select a conversation.
                        </p>
                      )}

                      {selectedConversation?.messages.map(
                        (message) => (
                          <div
                            key={message.id}
                            className={`rounded-[24px] p-4 ${
                              message.role === "user"
                                ? "bg-[#fde8f1]"
                                : "bg-[#e7f3ec]"
                            }`}
                          >
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f3d34]/45">
                              {message.role}
                            </p>

                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                              {message.text}
                            </p>

                            <p className="mt-3 text-xs text-[#1f3d34]/35">
                              {formatDate(message.created_at)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </section>

        <footer className="py-8 text-center text-xs font-semibold uppercase tracking-[0.25em] text-[#1f3d34]/40">
          Estimated screen time is based on message activity.
        </footer>
      </div>
    </main>
  );
}

function MetricCard({
  eyebrow,
  label,
  value,
}: {
  eyebrow: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[36px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white/80">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-[#1f3d34]/40">
        {eyebrow}
      </p>

      <p className="mt-5 text-5xl font-black tracking-[-0.08em] text-[#1f3d34]">
        {value}
      </p>

      <p className="mt-3 text-sm font-bold text-[#1f3d34]/60">
        {label}
      </p>
    </div>
  );
}

function RecentPanel({
  title,
  users,
  messages,
}: {
  title: string;
  users: number;
  messages: number;
}) {
  return (
    <div className="rounded-[36px] border border-[#1f3d34]/10 bg-white/65 p-5 backdrop-blur-2xl">
      <p className="text-sm font-black text-[#1f3d34]">{title}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-[24px] bg-[#1f3d34] p-4 text-white">
          <p className="text-4xl font-black tracking-[-0.06em]">
            {users}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/50">
            New users
          </p>
        </div>

        <div className="rounded-[24px] bg-[#f0b6ce]/75 p-4 text-[#1f3d34]">
          <p className="text-4xl font-black tracking-[-0.06em]">
            {messages}
          </p>

          <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#1f3d34]/50">
            Messages
          </p>
        </div>
      </div>
    </div>
  );
}

function TrafficBar({
  value,
  max,
  label,
  tone,
}: {
  value: number;
  max: number;
  label: string;
  tone: "rose" | "sage";
}) {
  const width = `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;

  return (
    <div>
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#1f3d34]/40">
        {label}
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-[#1f3d34]/8">
        <div
          className={`h-full rounded-full transition-all ${
            tone === "rose" ? "bg-[#d45f8f]" : "bg-[#7fb091]"
          }`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

function MiniInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#1f3d34]/10 bg-white/50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#1f3d34]/40">
        {label}
      </p>

      <p className="mt-2 text-sm font-bold text-[#1f3d34]/75">
        {value}
      </p>
    </div>
  );
}