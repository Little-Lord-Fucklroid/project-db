import type { RefObject } from "react";
import type { ChatMessage } from "@/lib/chatTypes";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";

type ChatShellProps = {
  messages: ChatMessage[];
  loading: boolean;
  message: string;
  listening: boolean;
  incognito: boolean;
  memoryCount: number;
  currentUserId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onOpenMemory: () => void;
  onNewChat: () => void | Promise<void>;
  onLeaveGuest: () => void;
  onSignOut: () => void | Promise<void>;
  onMessageChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onOpenVoiceScreen: () => void;
  onToggleIncognito: () => void | Promise<void>;
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
  onOpenMemory,
  onNewChat,
  onLeaveGuest,
  onSignOut,
  onMessageChange,
  onSend,
  onOpenVoiceScreen,
  onToggleIncognito,
}: ChatShellProps) {
  return (
    <main
      className="relative min-h-dvh w-full overflow-x-hidden px-3 py-4"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-20" />

      {/* fixed floating top bar */}
      <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2">
        <div className="rounded-[32px] border border-white/50 bg-white/45 backdrop-blur-xl">
          <ChatHeader
            onOpenMemory={onOpenMemory}
            onNewChat={onNewChat}
            onLeaveGuest={onLeaveGuest}
            memoryCount={memoryCount}
            currentUserId={currentUserId}
            incognito={incognito}
            onSignOut={onSignOut}
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[520px] flex-col overflow-x-hidden pt-[96px] pb-[148px]">
        <div
          className="glass-card flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto rounded-[28px] p-4 sm:rounded-[32px] sm:p-6"
          style={{
            boxShadow:
              "0 16px 60px rgba(40, 107, 53, 0.08)",
          }}
        >
          {messages.length === 0 && (
            <p className="text-gray-400">Start chatting...</p>
          )}

          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              role={msg.role}
              text={msg.text}
            />
          ))}

          {loading && (
            <MessageBubble
              role="ai"
              text="✨ Vibe is thinking..."
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          message={message}
          loading={loading}
          listening={listening}
          incognito={incognito}
          onMessageChange={onMessageChange}
          onSend={onSend}
          onOpenVoiceScreen={onOpenVoiceScreen}
          onToggleIncognito={onToggleIncognito}
        />
      </div>
    </main>
  );
}