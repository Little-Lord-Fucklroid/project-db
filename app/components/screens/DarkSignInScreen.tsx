"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/supabaseAuth";

// ─── Particle Canvas ────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouseMove);

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; color: string;
      life: number; maxLife: number; twinkle: number;
    };

    const colors = [
      "rgba(125,212,171,", // mint
      "rgba(240,160,188,", // pink
      "rgba(180,200,255,", // blue-white
      "rgba(200,170,240,", // lavender
      "rgba(255,255,255,", // white
    ];

    const particles: Particle[] = [];
    const count = 90;

    const spawn = (): Particle => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.15,
      size: Math.random() * 2.2 + 0.4,
      opacity: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0,
      maxLife: Math.random() * 280 + 120,
      twinkle: Math.random() * Math.PI * 2,
    });

    for (let i = 0; i < count; i++) {
      const p = spawn();
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      if (mx > 0) {
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 200);
        g.addColorStop(0, "rgba(125,212,171,0.06)");
        g.addColorStop(0.5, "rgba(240,160,188,0.03)");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.04;

        const t = p.life / p.maxLife;
        if (t < 0.2) p.opacity = t / 0.2;
        else if (t > 0.7) p.opacity = (1 - t) / 0.3;
        else p.opacity = 1;

        const alpha = p.opacity * (0.6 + 0.4 * Math.sin(p.twinkle)) * 0.7;

        if (mx > 0) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 250 && dist > 0) {
            p.vx += (dx / dist) * 0.003;
            p.vy += (dy / dist) * 0.003;
          }
        }

        p.vx *= 0.998;
        p.vy *= 0.998;

        ctx.beginPath();
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        glow.addColorStop(0, p.color + alpha + ")");
        glow.addColorStop(0.4, p.color + alpha * 0.4 + ")");
        glow.addColorStop(1, p.color + "0)");
        ctx.fillStyle = glow;
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.min(alpha * 1.8, 1) + ")";
        ctx.fill();

        if (p.life >= p.maxLife) {
          Object.assign(particles[i], spawn());
        }
      }

      // Connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            const alpha = (1 - dist / 80) * 0.12;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(180,200,220,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}
    />
  );
}

// ─── Aurora Background ────────────────────────────────────────────────────
function AuroraBackground() {
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetRef = useRef({ x: 0.5, y: 0.5 });
  const divRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      targetRef.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("mousemove", onMove);

    const animate = () => {
      mouseRef.current.x += (targetRef.current.x - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (targetRef.current.y - mouseRef.current.y) * 0.04;

      if (divRef.current) {
        const { x, y } = mouseRef.current;
        divRef.current.style.background = `
          radial-gradient(ellipse 80% 60% at ${x * 100}% ${y * 100}%,
            rgba(125,212,171,0.18) 0%,
            transparent 60%
          ),
          radial-gradient(ellipse 70% 80% at ${100 - x * 100}% ${100 - y * 100}%,
            rgba(240,160,188,0.15) 0%,
            transparent 55%
          ),
          radial-gradient(ellipse 50% 50% at 50% 50%,
            rgba(140,120,200,0.06) 0%,
            transparent 70%
          )
        `;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={divRef} style={{
      position: "absolute", inset: 0, zIndex: 0, transition: "none",
    }} />
  );
}

// ─── Animated Blobs ──────────────────────────────────────────────────────
function Blobs() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="blob blob-4" />
      <div className="blob blob-5" />
    </div>
  );
}

// ─── Tilt Card ────────────────────────────────────────────────────────────
function TiltCard({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetTilt = useRef({ rx: 0, ry: 0 });
  const currentTilt = useRef({ rx: 0, ry: 0 });
  const glowRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    targetTilt.current = { rx: -dy * 8, ry: dx * 8 };

    if (glowRef.current) {
      const px = ((e.clientX - rect.left) / rect.width) * 100;
      const py = ((e.clientY - rect.top) / rect.height) * 100;
      glowRef.current.style.background = `radial-gradient(circle 160px at ${px}% ${py}%, rgba(255,255,255,0.07), transparent)`;
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    targetTilt.current = { rx: 0, ry: 0 };
    if (glowRef.current) glowRef.current.style.background = "none";
  }, []);

  useEffect(() => {
    const animate = () => {
      currentTilt.current.rx += (targetTilt.current.rx - currentTilt.current.rx) * 0.1;
      currentTilt.current.ry += (targetTilt.current.ry - currentTilt.current.ry) * 0.1;
      if (cardRef.current) {
        cardRef.current.style.transform = `perspective(900px) rotateX(${currentTilt.current.rx}deg) rotateY(${currentTilt.current.ry}deg)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "420px",
        willChange: "transform",
        transformStyle: "preserve-3d",
        zIndex: 10,
      }}
    >
      <div className="rotating-border" />
      <div style={{
        position: "relative",
        background: "rgba(12,10,22,0.72)",
        backdropFilter: "blur(48px)",
        WebkitBackdropFilter: "blur(48px)",
        borderRadius: "28px",
        padding: "40px 34px",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: `
          0 40px 100px rgba(0,0,0,0.6),
          0 16px 40px rgba(0,0,0,0.4),
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(255,255,255,0.03)
        `,
        overflow: "hidden",
      }}>
        <div ref={glowRef} style={{ position: "absolute", inset: 0, pointerEvents: "none", borderRadius: "28px", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function GlowInput({
  type, placeholder, value, onChange, suffix, autoComplete,
}: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; suffix?: React.ReactNode; autoComplete?: string;
}) {
  const [focused, setFocused] = useState(false);
  const isMint = type === "email" || type === "text";
  const glowColor = isMint ? "rgba(125,212,171,0.35)" : "rgba(240,160,188,0.35)";
  const borderColor = focused
    ? isMint ? "rgba(125,212,171,0.55)" : "rgba(240,160,188,0.5)"
    : "rgba(255,255,255,0.08)";
  const bg = focused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)";

  return (
    <div style={{
      position: "relative",
      borderRadius: "14px",
      boxShadow: focused ? `0 0 0 3px ${glowColor}, 0 4px 24px ${glowColor}` : "none",
      transition: "box-shadow 0.25s ease",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: "14px",
        transition: "all 0.25s ease",
      }}>
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "rgba(255,255,255,0.92)",
            fontSize: "15px",
            fontFamily: "inherit",
            padding: "15px 18px",
            letterSpacing: "0.01em",
          }}
        />
        {suffix}
      </div>
    </div>
  );
}

function GradientButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="submit"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        padding: "16px",
        borderRadius: "14px",
        border: "none",
        cursor: "pointer",
        fontSize: "15px",
        fontWeight: "700",
        letterSpacing: "0.03em",
        color: "rgba(8,6,16,0.95)",
       backgroundImage: hovered
  ? "linear-gradient(135deg, #a0e8c8 0%, #d4a0c8 50%, #f8b8d4 100%)"
  : "linear-gradient(135deg, #7dd4ab 0%, #c0a0d8 40%, #f0a0bc 100%)",
backgroundSize: "200% 200%",
        transition: "transform 0.2s, box-shadow 0.25s, background 0.3s",
        transform: hovered ? "translateY(-2px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered
          ? "0 12px 40px rgba(125,212,171,0.4), 0 6px 20px rgba(240,160,188,0.3), 0 0 60px rgba(125,212,171,0.15)"
          : "0 4px 20px rgba(125,212,171,0.25), 0 2px 10px rgba(240,160,188,0.15)",
        fontFamily: "inherit",
      }}
    >
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </button>
  );
}

function SocialBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "13px 10px",
        borderRadius: "12px",
        background: h ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${h ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
        cursor: "pointer",
        color: h ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
        fontSize: "13.5px",
        fontWeight: "500",
        fontFamily: "inherit",
        transition: "all 0.2s ease",
        boxShadow: h ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
      <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "11.5px", letterSpacing: "0.08em", fontWeight: "500", textTransform: "uppercase" }}>or continue with</span>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }} />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────

type DarkSignInScreenProps = {
  onBack: () => void;
  onSignIn: () => void;
  onGuest: () => void;
  onSwitchToLight: () => void; // to toggle back to light mode
};

export default function DarkSignInScreen({
  onBack,
  onSignIn,
  onGuest,
  onSwitchToLight,
}: DarkSignInScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Enter your email and password.");
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      if (mode === "signup") {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      onSignIn();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      setErrorMessage("");
      await signInWithGoogle();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  const isSignIn = mode === "signin";

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{
        background: "#060610",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <AuroraBackground />
      <Blobs />
      <ParticleCanvas />

      {/* Scanline overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        pointerEvents: "none",
        zIndex: 2,
      }} />

      {/* Light mode toggle button */}
      <button
        onClick={onSwitchToLight}
        className="absolute top-4 right-4 z-20 text-sm font-medium rounded-full px-4 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition"
        style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.05)" }}
      >
        ☀️ Light
      </button>

      {/* Guest mode button (skip) */}
      <button
        onClick={onGuest}
        className="absolute top-4 left-4 z-20 text-sm font-medium rounded-full px-4 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition"
        style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.05)" }}
      >
        Skip
      </button>

      <div className="z-10 w-full max-w-sm">
        <TiltCard>
          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src="/mine_heart_nobg.png"
              alt="Vibe"
              style={{
                width: "64px",
                height: "64px",
                objectFit: "contain",
                filter: "drop-shadow(0 6px 24px rgba(125,212,171,0.5)) drop-shadow(0 3px 12px rgba(240,160,188,0.4))",
                marginBottom: "14px",
                animation: "logoFloat 5s ease-in-out infinite",
              }}
            />
            <div style={{
              fontSize: "24px",
              fontWeight: "900",
              letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #7dd4ab 0%, #c4a0d8 45%, #f0a0bc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              backgroundSize: "200% auto",
              animation: "shimmer 5s linear infinite",
            }}>
              vibe ai
            </div>
            <div style={{
              fontSize: "10.5px",
              color: "rgba(255,255,255,0.22)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontWeight: "600",
              marginTop: "4px",
            }}>
              your bestie, not your therapist
            </div>
          </div>

          {/* Sign In / Sign Up form */}
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {isSignIn ? (
              <>
                <div style={{ marginBottom: "4px" }}>
                  <h1 style={{ color: "#fff", fontSize: "25px", fontWeight: "800", letterSpacing: "-0.03em", margin: 0 }}>
                    hey, welcome back 👋
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "6px 0 0" }}>
                    your vibe is waiting — let's get you in
                  </p>
                </div>
                <GlowInput
                  type="email"
                  placeholder="email address"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />
                <GlowInput
                  type={showPassword ? "text" : "password"}
                  placeholder="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "0 16px" }}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  }
                />
                <div style={{ textAlign: "right", marginTop: "-4px" }}>
                  <button
                    type="button"
                    onClick={() => alert("Reset password link sent to your email.")}
                    style={{ background: "none", border: "none", color: "rgba(125,212,171,0.8)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", padding: 0, fontWeight: "500" }}
                  >
                    forgot password?
                  </button>
                </div>
                {errorMessage && <p style={{ color: "#f0a0bc", fontSize: "13px" }}>{errorMessage}</p>}
                <GradientButton onClick={handleAuth}>sign in</GradientButton>
              </>
            ) : (
              <>
                <div style={{ marginBottom: "4px" }}>
                  <h1 style={{ color: "#fff", fontSize: "25px", fontWeight: "800", letterSpacing: "-0.03em", margin: 0 }}>
                    let's be besties ✨
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", margin: "6px 0 0" }}>
                    no therapy vibes here — just you & your ai bestie
                  </p>
                </div>
                <GlowInput type="text" placeholder="what should i call you?" value={email} onChange={setEmail} />
                <GlowInput type="email" placeholder="email address" value={email} onChange={setEmail} />
                <GlowInput
                  type={showPassword ? "text" : "password"}
                  placeholder="create a password"
                  value={password}
                  onChange={setPassword}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: "0 16px" }}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  }
                />
                <GlowInput
                  type={showPassword ? "text" : "password"}
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
                {errorMessage && <p style={{ color: "#f0a0bc", fontSize: "13px" }}>{errorMessage}</p>}
                <GradientButton onClick={handleAuth}>start vibing 🌿</GradientButton>
              </>
            )}

            <Divider />

            <div style={{ display: "flex", gap: "10px" }}>
              <SocialBtn icon={<GoogleIcon />} label="Google" />
              <SocialBtn icon={<AppleIcon />} label="Apple" />
            </div>

            <p style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "13px", margin: "4px 0 0" }}>
              {isSignIn ? "don't have an account?" : "already vibing?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(isSignIn ? "signup" : "signin");
                  setErrorMessage("");
                }}
                style={{ background: "none", border: "none", color: isSignIn ? "rgba(240,160,188,0.9)" : "rgba(125,212,171,0.9)", fontFamily: "inherit", fontSize: "13px", fontWeight: "700", cursor: "pointer", padding: 0 }}
              >
                {isSignIn ? "join vibe ai" : "sign in"}
              </button>
            </p>
          </div>
        </TiltCard>
      </div>

      {/* Footer */}
      <div style={{
        position: "fixed",
        bottom: "18px",
        left: 0,
        right: 0,
        textAlign: "center",
        color: "rgba(255,255,255,0.15)",
        fontSize: "11.5px",
        letterSpacing: "0.06em",
        zIndex: 10,
        fontFamily: "'Inter', sans-serif",
      }}>
        your feelings are valid 🫶 · vibe ai
      </div>
    </main>
  );
}