type SignInScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
  onGuest: () => void;
};

export default function SignInScreen({
  onBack,
  onSignIn,
  onGuest,
}: SignInScreenProps) {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <button
        onClick={onBack}
        className="absolute top-6 left-6 text-2xl"
        style={{ color: "#286b35" }}
      >
        ←
      </button>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center text-center mb-10">
          <img
            src="/mine_heart_nobg.png"
            alt="Vibe"
            className="w-20 h-20 shimmer-heart mb-5"
          />

          <h1
            style={{
              fontSize: "30px",
              fontWeight: 800,
              color: "#191d18",
              marginBottom: "10px",
            }}
          >
            Welcome back
          </h1>

          <p
            style={{
              color: "#40493f",
              fontSize: "16px",
              opacity: 0.75,
            }}
          >
            Sign in to continue your safe space.
          </p>
        </div>

        <div
          className="glass-card rounded-[32px] p-7 space-y-5"
          style={{
            boxShadow: "0 16px 50px rgba(40,107,53,0.08)",
          }}
        >
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-2xl px-4 py-4 outline-none border border-white/60 bg-white/70 text-black placeholder:text-gray-500"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-2xl px-4 py-4 outline-none border border-white/60 bg-white/70 text-black placeholder:text-gray-500"
          />

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(112,122,110,0.2)",
              }}
            />

            <span
              style={{
                fontSize: "13px",
                color: "#707a6e",
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              OR CONTINUE WITH
            </span>

            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(112,122,110,0.2)",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.7)",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#191d18",
              }}
            >
              <img
                src="/google.svg"
                alt="Google"
                style={{ width: "18px", height: "18px" }}
              />
              Google
            </button>

            <button
              type="button"
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px",
                background: "rgba(255,255,255,0.5)",
                border: "1px solid rgba(255,255,255,0.7)",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "#191d18",
              }}
            >
              <img
                src="/apple.svg"
                alt="Apple"
                style={{ width: "18px", height: "18px" }}
              />
              Apple
            </button>
          </div>

          <button
            onClick={onSignIn}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: "18px",
              background:
                "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)",
              color: "#115925",
              fontWeight: 800,
              fontSize: "17px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 8px 30px rgba(136, 206, 141, 0.35)",
            }}
          >
            Sign In
          </button>
        </div>

        <p
          className="text-center mt-6"
          style={{
            color: "#40493f",
            fontSize: "14px",
            opacity: 0.75,
          }}
        >
          New here?{" "}
          <button
            onClick={onGuest}
            style={{
              color: "#286b35",
              fontWeight: 800,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Continue as guest
          </button>
        </p>
      </div>
    </main>
  );
}