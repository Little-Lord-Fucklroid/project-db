type MessageBubbleProps = {
  role: "user" | "ai";
  text: string;
};

export default function MessageBubble({
  role,
  text,
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
            ? "bg-pink-500 text-white rounded-br-md"
            : "bg-pink-50 text-gray-900 border border-pink-100 rounded-bl-md"
        }`}
      >
        <p className="text-xs font-semibold opacity-70 mb-1">
          {role === "user" ? "You" : "Vibe"}
        </p>

        <p className="leading-relaxed">{text}</p>
      </div>
    </div>
  );
}