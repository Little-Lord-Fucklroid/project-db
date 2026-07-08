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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatTimeSpent(minutes: number) {
  if (!minutes) return "0 min";

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours}h`;
  }

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
      <main className="min-h-dvh bg-[#f7faf3] p-5 text-black">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/60 bg-white/70 p-6 backdrop-blur-xl">
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-[#f7faf3] p-5 text-black">
        <div className="mx-auto max-w-7xl rounded-[32px] border border-white/60 bg-white/70 p-6 backdrop-blur-xl">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-3 text-red-600">{error}</p>

          <a
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-pink-500 px-5 py-3 font-semibold text-white"
          >
            Back to chat
          </a>
        </div>
      </main>
    );
  }

  if (!overview) {
    return null;
  }

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
    <main className="min-h-dvh bg-[#f7faf3] p-4 text-black sm:p-6">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-pink-500">
                Vibe Admin
              </p>

              <h1 className="text-3xl font-bold">
                Admin Dashboard
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Signed in as {overview.currentAdmin}
              </p>
            </div>

            <a
              href="/"
              className="rounded-2xl border border-pink-100 bg-white px-5 py-3 text-center font-semibold text-pink-600 hover:bg-pink-50"
            >
              Back to chat
            </a>
          </div>
        </section>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={overview.totals.users}
          />

          <StatCard
            label="Conversations"
            value={overview.totals.conversations}
          />

          <StatCard
            label="Messages"
            value={overview.totals.messages}
          />

          <StatCard
            label="Estimated Time"
            value={formatTimeSpent(
              overview.totals.estimatedMinutesSpent
            )}
          />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-3">
          <RecentCard
            label="Past 24 hours"
            users={overview.recent.newUsers24h}
            messages={overview.recent.messages24h}
          />

          <RecentCard
            label="Past 7 days"
            users={overview.recent.newUsers7d}
            messages={overview.recent.messages7d}
          />

          <RecentCard
            label="Past 30 days"
            users={overview.recent.newUsers30d}
            messages={overview.recent.messages30d}
          />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">
                  Recent Traffic
                </h2>
                <p className="text-sm text-gray-500">
                  Messages and new users over the last 7 days.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {overview.charts.dailyTraffic.map((day) => (
                <div key={day.label}>
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>{day.label}</span>
                    <span>
                      {day.messages} msgs · {day.newUsers} users
                    </span>
                  </div>

                  <div className="space-y-1">
                    <Bar
                      value={day.messages}
                      max={maxTraffic}
                      label="Messages"
                      tone="pink"
                    />

                    <Bar
                      value={day.newUsers}
                      max={maxTraffic}
                      label="New users"
                      tone="green"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Top Time Spent</h2>
            <p className="text-sm text-gray-500">
              Estimated from message activity.
            </p>

            <div className="mt-5 space-y-4">
              {overview.charts.topUsersByTime.length === 0 && (
                <p className="text-sm text-gray-500">
                  No activity yet.
                </p>
              )}

              {overview.charts.topUsersByTime.map((user) => (
                <div key={user.email}>
                  <div className="mb-1 flex justify-between gap-3 text-xs text-gray-500">
                    <span className="truncate">{user.email}</span>
                    <span className="shrink-0">
                      {formatTimeSpent(
                        user.estimatedMinutesSpent
                      )}
                    </span>
                  </div>

                  <Bar
                    value={user.estimatedMinutesSpent}
                    max={maxTopUserTime}
                    label="Time"
                    tone="pink"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">New Users</h2>
              <p className="text-sm text-gray-500">
                See users who joined recently.
              </p>
            </div>

            <div className="grid grid-cols-3 rounded-2xl bg-white/70 p-1 text-sm">
              <button
                onClick={() => setRecentFilter("24h")}
                className={`rounded-xl px-3 py-2 ${
                  recentFilter === "24h"
                    ? "bg-pink-500 text-white"
                    : "text-gray-600"
                }`}
              >
                24h
              </button>

              <button
                onClick={() => setRecentFilter("7d")}
                className={`rounded-xl px-3 py-2 ${
                  recentFilter === "7d"
                    ? "bg-pink-500 text-white"
                    : "text-gray-600"
                }`}
              >
                7d
              </button>

              <button
                onClick={() => setRecentFilter("30d")}
                className={`rounded-xl px-3 py-2 ${
                  recentFilter === "30d"
                    ? "bg-pink-500 text-white"
                    : "text-gray-600"
                }`}
              >
                30d
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-500">
                No new users in this period.
              </p>
            )}

            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl bg-white/70 p-4"
              >
                <p className="truncate font-semibold">
                  {user.email}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Joined {formatDate(user.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
          <div className="rounded-[32px] border border-white/60 bg-white/70 p-4 backdrop-blur-xl">
            <h2 className="text-xl font-bold">All Users</h2>
            <p className="text-sm text-gray-500">
              Click a user to view conversations.
            </p>

            <div className="mt-4 max-h-[700px] space-y-3 overflow-y-auto pr-1">
              {overview.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setSelectedConversationId(
                      user.conversations?.[0]?.id || ""
                    );
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedUserId === user.id
                      ? "border-pink-300 bg-pink-50"
                      : "border-white/60 bg-white/70 hover:bg-white"
                  }`}
                >
                  <p className="truncate font-semibold">
                    {user.email}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {user.conversationCount} conversations ·{" "}
                    {user.messageCount} messages
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Time spent:{" "}
                    {formatTimeSpent(
                      user.estimatedMinutesSpent
                    )}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-white/70 p-4 backdrop-blur-xl">
            {!selectedUser ? (
              <p className="text-gray-500">Select a user.</p>
            ) : (
              <>
                <div className="border-b border-white/70 pb-4">
                  <h2 className="truncate text-xl font-bold">
                    {selectedUser.email}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Joined: {formatDate(selectedUser.createdAt)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Last sign in:{" "}
                    {formatDate(selectedUser.lastSignInAt)}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Estimated time spent:{" "}
                    {formatTimeSpent(
                      selectedUser.estimatedMinutesSpent
                    )}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
                  <div>
                    <h3 className="font-bold">Conversations</h3>

                    <div className="mt-3 max-h-[560px] space-y-2 overflow-y-auto pr-1">
                      {selectedUser.conversations.length === 0 && (
                        <p className="text-sm text-gray-500">
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
                            className={`w-full rounded-2xl border p-3 text-left text-sm ${
                              selectedConversationId ===
                              conversation.id
                                ? "border-pink-300 bg-pink-50"
                                : "border-white/60 bg-white/70 hover:bg-white"
                            }`}
                          >
                            <p className="font-semibold">
                              Conversation {index + 1}
                            </p>

                            <p className="mt-1 text-gray-500">
                              {conversation.messages.length} messages
                            </p>

                            <p className="mt-1 text-gray-400">
                              {formatDate(conversation.updated_at)}
                            </p>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold">Messages</h3>

                    <div className="mt-3 max-h-[560px] space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-3">
                      {!selectedConversation && (
                        <p className="text-sm text-gray-500">
                          Select a conversation.
                        </p>
                      )}

                      {selectedConversation?.messages.map(
                        (message) => (
                          <div
                            key={message.id}
                            className={`rounded-2xl p-3 ${
                              message.role === "user"
                                ? "bg-pink-50"
                                : "bg-green-50"
                            }`}
                          >
                            <p className="text-xs font-semibold uppercase text-gray-500">
                              {message.role}
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm">
                              {message.text}
                            </p>

                            <p className="mt-2 text-xs text-gray-400">
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
          </div>
        </section>

        <p className="mt-5 text-sm text-gray-500">
          Time spent is estimated from message activity. Exact live
          screen time can be added later with lightweight session
          tracking.
        </p>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-bold sm:text-4xl">
        {value}
      </p>
    </div>
  );
}

function RecentCard({
  label,
  users,
  messages,
}: {
  label: string;
  users: number;
  messages: number;
}) {
  return (
    <div className="rounded-[32px] border border-white/60 bg-white/70 p-5 backdrop-blur-xl">
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-3xl font-bold">{users}</p>
          <p className="text-sm text-gray-500">new users</p>
        </div>

        <div>
          <p className="text-3xl font-bold">{messages}</p>
          <p className="text-sm text-gray-500">messages</p>
        </div>
      </div>
    </div>
  );
}

function Bar({
  value,
  max,
  label,
  tone,
}: {
  value: number;
  max: number;
  label: string;
  tone: "pink" | "green";
}) {
  const width = `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%`;

  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-white/80">
        <div
          className={`h-full rounded-full transition-all ${
            tone === "pink" ? "bg-pink-400" : "bg-green-400"
          }`}
          style={{ width }}
          title={`${label}: ${value}`}
        />
      </div>
    </div>
  );
}