export default function ChatHeader() {
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

      <div className="text-sm text-gray-500">
        Online ✨
      </div>
    </div>
  );
}