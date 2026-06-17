type ChatHeaderProps = {
  onOpenMemory: () => void;
};

export default function ChatHeader({
  onOpenMemory,
}: ChatHeaderProps) {
  return (
    <div
      className="sticky top-4 z-50 glass-card rounded-3xl px-5 py-4 mb-6 flex items-center justify-between"
      style={{
        boxShadow: "0 12px 40px rgba(40, 107, 53, 0.10)",
      }}
    >
      <img
        src="/mine_heart_nobg.png"
        alt="Vibe"
        className="w-11 h-11 shimmer-heart"
      />

      <h1
        className="text-2xl font-bold"
        style={{ color: "#286b35" }}
      >
        Vibe AI
      </h1>

      <button
        onClick={onOpenMemory}
        className="px-3 py-2 rounded-2xl text-sm font-semibold transition"
        style={{
          background: "rgba(255,255,255,0.6)",
          border: "1px solid rgba(255,255,255,0.7)",
          color: "#286b35",
        }}
      >
        🧠 Memory
      </button>
    </div>
  );
}