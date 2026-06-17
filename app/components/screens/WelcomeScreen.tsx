type WelcomeScreenProps = {
  onGetStarted: () => void;
  onSignIn: () => void;
};

export default function WelcomeScreen({
  onGetStarted,
  onSignIn,
}: WelcomeScreenProps) {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <div
        className="fixed top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "rgba(255,177,192,0.12)",
          filter: "blur(100px)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div
        className="fixed bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "rgba(172,244,175,0.12)",
          filter: "blur(120px)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <header className="fixed top-0 left-0 w-full flex items-center justify-center py-5 px-5 z-20">
        <div className="flex items-center gap-2">
          <span
            className="text-[#286b35]"
            style={{ fontSize: "22px" }}
          >
            ♥
          </span>

          <span
            style={{
              fontWeight: 700,
              fontSize: "20px",
              color: "#286b35",
              letterSpacing: "-0.01em",
            }}
          >
            Vibe
          </span>
        </div>
      </header>

      <section className="flex flex-col items-center text-center px-6 z-10 max-w-sm w-full">
        <div
          className="relative flex items-center justify-center mb-8 float-anim"
          style={{ width: "220px", height: "220px" }}
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
            alt="Vibe crystal heart"
            className="shimmer-heart"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              mixBlendMode: "screen",
              position: "relative",
              zIndex: 1,
              filter:
                "drop-shadow(0 16px 40px rgba(144,215,149,0.5))",
            }}
          />
        </div>

        <h1
          style={{
            fontWeight: 800,
            fontSize: "30px",
            lineHeight: "1.15",
            color: "#191d18",
            letterSpacing: "-0.02em",
            marginBottom: "12px",
          }}
        >
          I&apos;m here for you.
        </h1>

        <p
          style={{
            fontSize: "17px",
            lineHeight: "1.6",
            color: "#40493f",
            opacity: 0.85,
            marginBottom: "44px",
            maxWidth: "280px",
          }}
        >
          Your safe space to talk, vibe, and be heard. No judgment.
          Just bestie energy.
        </p>

        <button
          onClick={onGetStarted}
          style={{
            width: "100%",
            maxWidth: "320px",
            padding: "16px 24px",
            borderRadius: "18px",
            background: "#286b35",
            color: "white",
            fontWeight: 700,
            fontSize: "18px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 12px 30px rgba(40,107,53,0.25)",
          }}
        >
          Get Started →
        </button>

        <p
          style={{
            marginTop: "24px",
            fontSize: "14px",
            color: "#40493f",
            opacity: 0.7,
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSignIn}
            style={{
              color: "#286b35",
              fontWeight: 700,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}