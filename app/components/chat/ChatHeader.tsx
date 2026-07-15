"use client";

import { useState } from "react";

type ChatHeaderProps = {
  onOpenMemory: () => void;
  onNewChat: () => void | Promise<void>;
  onLeaveGuest: () => void;
  memoryCount: number;
  currentUserId: string | null;
  incognito: boolean;
  onSignOut: () => void | Promise<void>;
};

export default function ChatHeader({
  onOpenMemory,
  onNewChat,
  onLeaveGuest,
  memoryCount,
  currentUserId,
  incognito,
  onSignOut,
}: ChatHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusText = incognito
    ? "Incognito"
    : currentUserId
      ? "Cloud"
      : "Guest";

  const showLeaveGuestButton = !currentUserId && !incognito;

  async function handleNewChatClick() {
    setMenuOpen(false);
    await onNewChat();
  }

  async function handleLeaveGuestClick() {
    setMenuOpen(false);
    onLeaveGuest();
  }

  async function handleSignOutClick() {
    setMenuOpen(false);
    await onSignOut();
  }

  return (
    <header
      style={{
        position: "sticky",
        top: "20px",
        zIndex: 100,
        marginBottom: "18px",
        padding: "16px 20px",
        borderRadius: "28px",
        background: "rgba(255, 255, 255, 0.58)",
        border: "1px solid rgba(255, 255, 255, 0.78)",
        boxShadow: "0 18px 60px rgba(40, 107, 53, 0.12)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 900,
            color: "#191d18",
            letterSpacing: "-0.04em",
            margin: 0,
          }}
        >
          Vibe
        </h1>

        <p
          style={{
            fontSize: "13px",
            color: "#707a6e",
            fontWeight: 600,
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              backgroundColor:
                statusText === "Cloud" ? "#286b35" :
                statusText === "Incognito" ? "#d46b94" :
                "#8fb59c",
            }}
          />
          {statusText} mode
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          position: "relative",
        }}
      >
        <button
          onClick={onOpenMemory}
          style={{
            borderRadius: "999px",
            padding: "10px 16px",
            fontWeight: 800,
            background: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            color: "#286b35",
            boxShadow: "0 8px 25px rgba(40, 107, 53, 0.08)",
            cursor: "pointer",
          }}
        >
          🧠 {memoryCount}{" "}
          {memoryCount === 1 ? "Memory" : "Memories"}
        </button>

        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Open chat menu"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              background: "rgba(255, 255, 255, 0.7)",
              border: "1px solid rgba(255, 255, 255, 0.9)",
              color: "#191d18",
              boxShadow: "0 8px 25px rgba(40, 107, 53, 0.08)",
              fontSize: "22px",
              lineHeight: 1,
              cursor: "pointer",
            }}
          >
            ⋯
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "52px",
                width: "170px",
                padding: "8px",
                borderRadius: "18px",
                background: "rgba(255, 255, 255, 0.96)",
                border: "1px solid rgba(255, 255, 255, 0.9)",
                boxShadow:
                  "0 18px 45px rgba(40, 107, 53, 0.16)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                zIndex: 200,
              }}
            >
              {/* Only show New chat for signed-in users */}
              {currentUserId && (
                <button
                  onClick={handleNewChatClick}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontWeight: 800,
                    color: "#191d18",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  New chat
                </button>
              )}

              {showLeaveGuestButton && (
                <button
                  onClick={handleLeaveGuestClick}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontWeight: 800,
                    color: "#d46b94",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Leave Guest
                </button>
              )}

              {currentUserId && (
                <button
                  onClick={handleSignOutClick}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontWeight: 800,
                    color: "#191d18",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}