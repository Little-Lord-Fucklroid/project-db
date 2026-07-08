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

type AdminOverview = {
  currentAdmin: string;
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
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

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] =
    useState<AdminOverview | null>(null);
  const [error, setError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedConversationId, setSelectedConversationId] =
    useState("");

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

  if (loading) {
    return (
      <main className="min-h-dvh bg-[#f7faf3] p-5 text-black">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/70 p-6 backdrop-blur-xl">
          Loading admin dashboard...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-dvh bg-[#f7faf3] p-5 text-black">
        <div className="mx-auto max-w-6xl rounded-3xl bg-white/70 p-6 backdrop-blur-xl">
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

  return (
    <main className="min-h-dvh bg-[#f7faf3] p-4 text-black sm:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white/70 p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <StatCard label="Users" value={overview.totalUsers} />
          <StatCard
            label="Conversations"
            value={overview.totalConversations}
          />
          <StatCard
            label="Messages"
            value={overview.totalMessages}
          />
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[360px_1fr]">
          <section className="rounded-3xl bg-white/70 p-4 backdrop-blur-xl">
            <h2 className="text-xl font-bold">Users</h2>

            <div className="mt-4 space-y-3">
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
          </section>

          <section className="rounded-3xl bg-white/70 p-4 backdrop-blur-xl">
            {!selectedUser ? (
              <p className="text-gray-500">Select a user.</p>
            ) : (
              <>
                <div className="border-b border-white/70 pb-4">
                  <h2 className="text-xl font-bold">
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

                    <div className="mt-3 space-y-2">
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
          </section>
        </div>

        <p className="mt-5 text-sm text-gray-500">
          Time spent is estimated from message activity. Exact live
          screen time can be added later with session tracking.
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
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white/70 p-5 backdrop-blur-xl">
      <p className="text-sm font-semibold text-gray-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
    </div>
  );
}