type ChatInputProps = {
  message: string;
  loading: boolean;
  listening: boolean;
  incognito: boolean;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onOpenVoiceScreen: () => void;
  onToggleIncognito: () => void;
};

export default function ChatInput({
  message,
  loading,
  listening,
  incognito,
  onMessageChange,
  onSend,
  onOpenVoiceScreen,
  onToggleIncognito,
}: ChatInputProps) {
  return (
    <div className="sticky bottom-4 z-50 w-full max-w-full rounded-3xl border border-pink-100 bg-white/90 p-3 shadow-lg backdrop-blur">
      <div className="flex w-full max-w-full flex-wrap gap-2 sm:flex-nowrap">
        <input
          className="min-w-0 w-full flex-[1_1_100%] rounded-2xl border border-pink-100 bg-pink-50 p-3 text-black outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-pink-200 sm:flex-[1_1_auto]"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSend();
            }
          }}
        />

        <button
          onClick={onOpenVoiceScreen}
          className={`h-12 flex-none rounded-2xl px-4 shadow-sm transition ${
            listening
              ? "bg-pink-500 text-white"
              : "border border-pink-100 bg-white text-pink-600 hover:bg-pink-50"
          }`}
        >
          {listening ? "..." : "🎤"}
        </button>

        <button
          onClick={onToggleIncognito}
          className="h-12 min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 text-sm text-black shadow-sm hover:bg-gray-50 sm:flex-none sm:px-4"
        >
          <span className="block truncate">
            {incognito ? "🌙 Exit Incognito" : "🌙 Incognito"}
          </span>
        </button>

        <button
          onClick={onSend}
          className="h-12 flex-none rounded-2xl bg-pink-500 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-pink-600 disabled:opacity-50 sm:px-6"
          disabled={loading}
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}