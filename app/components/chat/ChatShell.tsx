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
      className="min-h-screen flex justify-center p-5 relative"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-20" />

      <div className="w-full max-w-4xl">
        <ChatHeader
          onOpenMemory={onOpenMemory}
          onNewChat={onNewChat}
          onLeaveGuest={onLeaveGuest}
          memoryCount={memoryCount}
          currentUserId={currentUserId}
          incognito={incognito}
          onSignOut={onSignOut}
        />

        <div
          className="glass-card rounded-[32px] p-6 min-h-[75vh] mb-4"
          style={{
            boxShadow:
              "0 16px 60px rgba(40, 107, 53, 0.08)",
          }}
        >
          {messages.length === 0 && (
            <p>Start chatting...</p>
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