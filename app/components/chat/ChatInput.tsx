type ChatInputProps = {
  message: string;
  loading: boolean;
  listening: boolean;
  incognito: boolean;
  guestLimitReached?: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onOpenVoiceScreen: () => void;
  onToggleIncognito: () => void;
  onGuestLimitSignIn?: () => void;
  onIcebreaker: () => void; // NEW
};

export default function ChatInput({
  message,
  loading,
  listening,
  incognito,
  guestLimitReached = false,
  onMessageChange,
  onSend,
  onOpenVoiceScreen,
  onToggleIncognito,
  onGuestLimitSignIn,
  onIcebreaker, // NEW
}: ChatInputProps) {
  const isSendDisabled = loading || guestLimitReached;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-[520px] -translate-x-1/2 overflow-hidden rounded-3xl border border-white/50 bg-white/45 p-3 backdrop-blur-xl">
      <div className="flex w-full flex-col gap-2">
        <input
          className="min-w-0 w-full rounded-2xl border border-pink-100 bg-pink-50 p-3 text-black outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-pink-200 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={guestLimitReached ? "Guest limit reached – sign in to continue" : "Type a message..."}
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isSendDisabled) {
              onSend();
            }
          }}
          disabled={guestLimitReached}
        />

        <div className="grid w-full grid-cols-[56px_56px_minmax(0,1fr)_78px] gap-2">
          {/* Voice button */}
          <button
            onClick={onOpenVoiceScreen}
            className={`h-12 rounded-2xl shadow-sm transition ${
              listening
                ? "bg-pink-500 text-white"
                : "border border-pink-100 bg-white text-pink-600 hover:bg-pink-50"
            }`}
            disabled={guestLimitReached}
          >
            {listening ? "..." : "🎤"}
          </button>

          {/* NEW: Icebreaker button */}
          <button
            onClick={onIcebreaker}
            className="h-12 rounded-2xl border border-pink-100 bg-white text-pink-600 shadow-sm transition hover:bg-pink-50"
            title="Get a conversation starter"
            disabled={guestLimitReached}
          >
            💡
          </button>

          {/* Incognito toggle */}
          <button
            onClick={onToggleIncognito}
            className="min-w-0 rounded-2xl border border-gray-300 bg-white px-2 text-sm text-black shadow-sm hover:bg-gray-50"
          >
            <span className="block truncate">
              {incognito ? "🌙 Exit" : "🌙 Incognito"}
            </span>
          </button>

          {/* Send / Sign In button */}
          {guestLimitReached ? (
            <button
              onClick={onGuestLimitSignIn}
              className="h-12 rounded-2xl bg-[#d46b94] text-sm font-bold text-white shadow-md transition hover:bg-[#c45a7e]"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={onSend}
              className="h-12 rounded-2xl bg-pink-500 text-sm font-semibold text-white shadow-md transition hover:bg-pink-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "..." : "Send"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}