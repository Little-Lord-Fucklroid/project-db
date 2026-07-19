import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chatTypes";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import DarkBackgroundEffects from "../DarkBackgroundEffects"; // NEW – we'll create this next

type ChatShellProps = {
  messages: ChatMessage[];
  loading: boolean;
  message: string;
  listening: boolean;
  incognito: boolean;
  memoryCount: number;
  currentUserId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  guestLimitReached?: boolean;
  onOpenMemory: () => void;
  onNewChat: () => void | Promise<void>;
  onLeaveGuest: () => void;
  onSignOut: () => void | Promise<void>;
  onMessageChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onOpenVoiceScreen: () => void;
  onToggleIncognito: () => void | Promise<void>;
  onGuestLimitSignIn?: () => void;
  onIcebreaker: () => void;
  // ─── NEW dark mode props ───
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
};

export default function ChatShell({
  messages,
  loading,
  message,
  listening,
  incognito,
  memoryCount,
  currentUserId,
  messagesEndRef,
  guestLimitReached = false,
  onOpenMemory,
  onNewChat,
  onLeaveGuest,
  onSignOut,
  onMessageChange,
  onSend,
  onOpenVoiceScreen,
  onToggleIncognito,
  onGuestLimitSignIn,
  onIcebreaker,
  darkMode = false,
  onToggleDarkMode,
}: ChatShellProps) {
  return (
    <main
      className={`relative min-h-dvh w-full overflow-x-hidden px-3 py-4 transition-colors duration-300 ${
        darkMode ? "bg-[#060610]" : "bg-[#f7faf3]"
      }`}
    >
      {/* Background effects */}
      {darkMode ? (
        <DarkBackgroundEffects />
      ) : (
        <>
          <div className="mesh-bg" />
          <div className="light-ray opacity-20" />
        </>
      )}

      <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2">
        <div
          className={`rounded-[32px] backdrop-blur-xl transition-colors duration-300 ${
            darkMode
              ? "border border-white/10 bg-white/5"
              : "border border-white/50 bg-white/45"
          }`}
        >
          <ChatHeader
            onOpenMemory={onOpenMemory}
            onNewChat={onNewChat}
            onLeaveGuest={onLeaveGuest}
            memoryCount={memoryCount}
            currentUserId={currentUserId}
            incognito={incognito}
            onSignOut={onSignOut}
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[520px] flex-col overflow-x-hidden pt-[96px] pb-[148px]">
        <div
          className={`flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto rounded-[28px] p-4 sm:rounded-[32px] sm:p-6 transition-colors duration-300 ${
            darkMode
              ? "bg-white/5 border border-white/10"
              : "glass-card"
          }`}
          style={{
            boxShadow: darkMode
              ? "0 16px 60px rgba(0,0,0,0.4)"
              : "0 16px 60px rgba(40, 107, 53, 0.08)",
          }}
        >
          {messages.length === 0 && (
            <p className={darkMode ? "text-white/40" : "text-gray-400"}>
              Start chatting...
            </p>
          )}

          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              role={msg.role}
              text={msg.text}
              darkMode={darkMode}
            />
          ))}

          {loading && (
            <MessageBubble
              role="ai"
              text="✨ Vibe is thinking..."
              darkMode={darkMode}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          message={message}
          loading={loading}
          listening={listening}
          incognito={incognito}
          guestLimitReached={guestLimitReached}
          onMessageChange={onMessageChange}
          onSend={onSend}
          onOpenVoiceScreen={onOpenVoiceScreen}
          onToggleIncognito={onToggleIncognito}
          onGuestLimitSignIn={onGuestLimitSignIn}
          onIcebreaker={onIcebreaker}
          darkMode={darkMode}
        />
      </div>
    </main>
  );
}