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
    <div className="sticky bottom-4 z-50 bg-white/90 backdrop-blur border border-pink-100 rounded-3xl shadow-lg p-3 flex gap-2">
      <input
        className="bg-pink-50 text-black placeholder:text-gray-500 border border-pink-100 p-3 flex-1 rounded-2xl outline-none focus:ring-2 focus:ring-pink-200"
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
        className={`px-4 py-3 rounded-2xl shadow-sm transition ${
          listening
            ? "bg-pink-500 text-white"
            : "bg-white border border-pink-100 text-pink-600 hover:bg-pink-50"
        }`}
      >
        {listening ? "Listening..." : "🎤"}
      </button>

      <button
        onClick={onToggleIncognito}
        className="bg-white text-black border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50"
      >
        {incognito ? "🌙 Exit Incognito" : "🌙 Incognito"}
      </button>

      <button
        onClick={onSend}
        className="bg-pink-500 text-white px-6 py-3 rounded-2xl shadow-md hover:bg-pink-600 transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}