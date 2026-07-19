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
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
};

export default function ChatHeader({
  onOpenMemory,
  onNewChat,
  onLeaveGuest,
  memoryCount,
  currentUserId,
  incognito,
  onSignOut,
  darkMode = false,
  onToggleDarkMode,
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
        background: darkMode
          ? "rgba(255, 255, 255, 0.08)"
          : "rgba(255, 255, 255, 0.58)",
        border: darkMode
          ? "1px solid rgba(255, 255, 255, 0.1)"
          : "1px solid rgba(255, 255, 255, 0.78)",
        boxShadow: darkMode
          ? "0 18px 60px rgba(0,0,0,0.4)"
          : "0 18px 60px rgba(40, 107, 53, 0.12)",
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
            color: darkMode ? "#fff" : "#191d18",
            letterSpacing: "-0.04em",
            margin: 0,
          }}
        >
          Vibe
        </h1>

        <p
          style={{
            fontSize: "13px",
            color: darkMode ? "rgba(255,255,255,0.5)" : "#707a6e",
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
                statusText === "Cloud" ? "#4cd964" :
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
            background: darkMode
              ? "rgba(255,45,120,0.15)"
              : "rgba(255, 255, 255, 0.7)",
            border: darkMode
              ? "1px solid rgba(255,45,120,0.3)"
              : "1px solid rgba(255, 255, 255, 0.9)",
            color: darkMode ? "#ff6b9d" : "#286b35",
            boxShadow: darkMode
              ? "0 8px 25px rgba(255,45,120,0.15)"
              : "0 8px 25px rgba(40, 107, 53, 0.08)",
            cursor: "pointer",
          }}
        >
          🧠 {memoryCount}{" "}
          {memoryCount === 1 ? "Memory" : "Memories"}
        </button>

        {/* Dark mode toggle button */}
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.05)",
              border: darkMode
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(0,0,0,0.08)",
              color: darkMode ? "#fff" : "#191d18",
              boxShadow: darkMode
                ? "0 8px 25px rgba(0,0,0,0.2)"
                : "0 8px 25px rgba(40, 107, 53, 0.08)",
              cursor: "pointer",
              fontSize: "22px",
              lineHeight: 1,
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        )}

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
              background: darkMode
                ? "rgba(255,255,255,0.08)"
                : "rgba(255, 255, 255, 0.7)",
              border: darkMode
                ? "1px solid rgba(255,255,255,0.1)"
                : "1px solid rgba(255, 255, 255, 0.9)",
              color: darkMode ? "#fff" : "#191d18",
              boxShadow: darkMode
                ? "0 8px 25px rgba(0,0,0,0.2)"
                : "0 8px 25px rgba(40, 107, 53, 0.08)",
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
                background: darkMode
                  ? "rgba(20,20,30,0.96)"
                  : "rgba(255, 255, 255, 0.96)",
                border: darkMode
                  ? "1px solid rgba(255,255,255,0.1)"
                  : "1px solid rgba(255, 255, 255, 0.9)",
                boxShadow: darkMode
                  ? "0 18px 45px rgba(0,0,0,0.6)"
                  : "0 18px 45px rgba(40, 107, 53, 0.16)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                zIndex: 200,
              }}
            >
              {/* Only show New chat for signed-in users and not incognito */}
              {currentUserId && !incognito && (
                <button
                  onClick={handleNewChatClick}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontWeight: 800,
                    color: darkMode ? "#fff" : "#191d18",
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
                    color: darkMode ? "#fff" : "#191d18",
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