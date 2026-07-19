type MessageBubbleProps = {
  role: "user" | "ai";
  text: string;
  darkMode?: boolean;
};

export default function MessageBubble({
  role,
  text,
  darkMode = false,
}: MessageBubbleProps) {
  return (
    <div
      className={`mb-4 flex ${
        role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-3xl px-5 py-3 shadow-sm ${
          role === "user"
            ? darkMode
              ? "bg-gradient-to-r from-pink-500 to-pink-400 text-white rounded-br-md"
              : "bg-pink-500 text-white rounded-br-md"
            : darkMode
              ? "bg-white/10 text-white/90 border border-white/10 rounded-bl-md"
              : "bg-pink-50 text-gray-900 border border-pink-100 rounded-bl-md"
        }`}
      >
        <p
          className={`text-xs font-semibold mb-1 ${
            role === "user"
              ? "opacity-80"
              : darkMode
                ? "text-white/40"
                : "opacity-70"
          }`}
        >
          {role === "user" ? "You" : "Vibe"}
        </p>

        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}