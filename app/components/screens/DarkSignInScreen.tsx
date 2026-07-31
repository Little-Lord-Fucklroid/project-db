"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/supabaseAuth";
import DarkBackgroundEffects from "../DarkBackgroundEffects";

function GlowInput({
  type, placeholder, value, onChange, autoComplete, suffix,
}: {
  type: string; placeholder: string; value: string;
  onChange: (v: string) => void; autoComplete?: string; suffix?: React.ReactNode;
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

function SocialButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  const [h, setH] = useState(false);
  return (
    <button
      type="button"
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: "12px",
        borderRadius: "16px",
        background: h ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${h ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
        color: h ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.6)",
        fontSize: "13.5px",
        fontWeight: "500",
        fontFamily: "inherit",
        transition: "all 0.2s ease",
        boxShadow: h ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {icon}
      {label}
    </button>
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
  onSwitchToLight: () => void;
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
      <DarkBackgroundEffects />

      {/* Light mode toggle */}
      <button
        onClick={onSwitchToLight}
        className="absolute top-4 right-4 z-20 text-sm font-medium rounded-full px-4 py-2 border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition"
        style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.05)" }}
      >
        ☀️ Light
      </button>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 text-2xl"
        style={{ color: "rgba(255,255,255,0.7)" }}
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
              color: "rgba(255,255,255,0.92)",
              marginBottom: "10px",
            }}
          >
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "16px",
              opacity: 0.75,
            }}
          >
            {mode === "signin"
              ? "Sign in to continue your safe space."
              : "Create an account to save your chats and memories."}
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: "32px",
            padding: "28px",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 16px 60px rgba(0,0,0,0.4)",
          }}
        >
          <GlowInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
          />
          <GlowInput
            type={showPassword ? "text" : "password"}
            placeholder="Password"
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
          {errorMessage && (
            <p style={{ color: "#f0a0bc", fontSize: "13px", fontWeight: 600 }}>
              {errorMessage}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1))" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.04em" }}>
              OR CONTINUE WITH
            </span>
            <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, rgba(255,255,255,0.1), transparent)" }} />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <SocialButton
              icon={<GoogleIcon />}
              label="Google"
              onClick={handleGoogleSignIn}
              disabled={loading}
            />
            <SocialButton
              icon={<AppleIcon />}
              label="Apple"
              onClick={() => alert("Apple sign-in coming later.")}
            />
          </div>
          <button
            onClick={handleAuth}
            disabled={loading}
            style={{
              width: "100%",
              padding: "16px 24px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)",
              color: "#115925",
              fontWeight: 800,
              fontSize: "17px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.65 : 1,
              boxShadow: "0 8px 30px rgba(136, 206, 141, 0.35)",
              marginTop: "8px",
            }}
          >
            {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <p className="text-center mt-6" style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", opacity: 0.75 }}>
          {mode === "signin" ? "New here?" : "Already joined?"}{" "}
          <button
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            style={{ color: "rgba(125,212,171,0.9)", fontWeight: 800, background: "none", border: "none", cursor: "pointer" }}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
        <p className="text-center mt-3" style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", opacity: 0.75 }}>
          Want to skip?{" "}
          <button
            onClick={onGuest}
            style={{ color: "rgba(125,212,171,0.9)", fontWeight: 800, background: "none", border: "none", cursor: "pointer" }}
          >
            Continue as guest
          </button>
        </p>
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