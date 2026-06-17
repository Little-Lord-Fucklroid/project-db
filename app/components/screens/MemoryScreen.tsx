import type { Memory } from "@/lib/memory";

type MemoryScreenProps = {
  memories: Memory[];
  onBack: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
};

export default function MemoryScreen({
  memories,
  onBack,
  onDelete,
  onClearAll,
}: MemoryScreenProps) {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center relative overflow-hidden px-6 py-8"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <div className="w-full max-w-md z-10">
        <button
          onClick={onBack}
          className="mb-6 text-2xl"
          style={{ color: "#286b35" }}
        >
          ←
        </button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>

          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#191d18",
              marginBottom: "8px",
            }}
          >
            Vibe&apos;s Memory
          </h1>

          <p
            style={{
              color: "#40493f",
              fontSize: "15px",
              opacity: 0.75,
            }}
          >
            Things Vibe remembers about you.
          </p>
        </div>

        <div
          className="glass-card rounded-[32px] p-5 space-y-3"
          style={{
            boxShadow: "0 16px 50px rgba(40,107,53,0.08)",
          }}
        >
          {memories.length === 0 ? (
            <p
              className="text-center py-8"
              style={{ color: "#40493f", opacity: 0.75 }}
            >
              No memories saved yet.
            </p>
          ) : (
            memories.map((memory) => (
              <div
                key={memory.id}
                className="bg-white/70 border border-white/70 rounded-2xl p-4 flex items-start justify-between gap-3"
              >
                <p className="text-black leading-relaxed">
                  {memory.text}
                </p>

                <button
                  onClick={() => onDelete(memory.id)}
                  className="text-sm font-bold px-3 py-2 rounded-xl"
                  style={{
                    color: "#b42318",
                    background: "rgba(255,255,255,0.7)",
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}

          <div className="space-y-3 pt-3">
  {memories.length > 0 && (
    <button
      onClick={() => {
        const confirmed = confirm(
          "Clear all memories and current chat history?"
        );

        if (confirmed) {
          onClearAll();
        }
      }}
      className="w-full rounded-2xl py-4 font-bold"
      style={{
        background: "#286b35",
        color: "white",
      }}
    >
      Clear All Memories
    </button>
  )}

  <button
    onClick={() => {
      const confirmed = confirm(
        "Clear current chat history?"
      );

      if (confirmed) {
        onClearAll();
      }
    }}
    className="w-full rounded-2xl py-4 font-bold"
    style={{
      background: "rgba(255,255,255,0.7)",
      color: "#b42318",
      border: "1px solid rgba(180,35,24,0.15)",
    }}
  >
    Clear Chat History
  </button>
</div>
        </div>
      </div>
    </main>
  );
}