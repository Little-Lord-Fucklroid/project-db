type VoiceScreenProps = {
  onBack: () => void;
};

export default function VoiceScreen({
  onBack,
}: VoiceScreenProps) {
  return (
    <main
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-20" />

      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-2xl"
      >
        ←
      </button>

      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center mb-10 float-anim"
          style={{ width: "260px", height: "260px" }}
        >
          <div
            className="absolute inset-0 rounded-full pulse-orb"
            style={{
              background: "rgba(136,206,141,0.25)",
              filter: "blur(40px)",
            }}
          />

          <img
            src="/mine_heart.png"
            alt="Listening"
            className="shimmer-heart"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              position: "relative",
              zIndex: 1,
            }}
          />
        </div>

        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#286b35",
            marginBottom: "12px",
          }}
        >
          Listening...
        </h2>

        <div className="flex items-end gap-2 h-14">
          <div className="wave-bar w-2 h-8 bg-green-400 rounded-full" />

          <div
            className="wave-bar w-2 h-12 bg-green-400 rounded-full"
            style={{ animationDelay: "0.15s" }}
          />

          <div
            className="wave-bar w-2 h-14 bg-green-400 rounded-full"
            style={{ animationDelay: "0.3s" }}
          />

          <div
            className="wave-bar w-2 h-10 bg-green-400 rounded-full"
            style={{ animationDelay: "0.45s" }}
          />

          <div
            className="wave-bar w-2 h-6 bg-green-400 rounded-full"
            style={{ animationDelay: "0.6s" }}
          />
        </div>
      </div>
    </main>
  );
}