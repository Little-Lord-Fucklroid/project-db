"use client";

import { useState, useEffect, useRef } from "react";

type IncognitoPinModalProps = {
  mode: "create" | "unlock";
  error?: string;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
};

export default function IncognitoPinModal({
  mode,
  error: externalError,
  onSuccess,
  onCancel,
}: IncognitoPinModalProps) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(externalError || "");
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);
  const [mergePhase, setMergePhase] = useState<"idle" | "merging" | "success">("idle");
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external error into internal state
  useEffect(() => {
    setError(externalError || "");
  }, [externalError]);

  // Trigger shake when error appears
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      shakeTimeoutRef.current = setTimeout(() => setIsShaking(false), 400);
    }
  }, [error]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
      if (mergeTimeoutRef.current) clearTimeout(mergeTimeoutRef.current);
    };
  }, []);

  function handleChange(index: number, value: string) {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);

    // Trigger digit-enter animation on this input
    if (value) {
      setAnimatedIndex(index);
      setTimeout(() => setAnimatedIndex(null), 250);
    }

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If all 4 digits are filled, trigger merge finale then submit
    if (newPin.every((d) => d !== "")) {
      const fullPin = newPin.join("");
      setError("");
      setMergePhase("merging");

      // After merge collapse, show success checkmark
      mergeTimeoutRef.current = setTimeout(() => {
        setMergePhase("success");

        // After success animation, call onSuccess
        submitTimeoutRef.current = setTimeout(() => {
          setMergePhase("idle");
          onSuccess(fullPin);
        }, 600);
      }, 350);
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace to previous input
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    // Escape to cancel
    if (e.key === "Escape") {
      onCancel();
    }
  };

  const handleCancel = () => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    if (mergeTimeoutRef.current) clearTimeout(mergeTimeoutRef.current);
    setPin(["", "", "", ""]);
    setError("");
    setMergePhase("idle");
    setIsShaking(false);
    setAnimatedIndex(null);
    onCancel();
  };

  const title = mode === "create" ? "Set Incognito PIN" : "Enter PIN";
  const description =
    mode === "create"
      ? "Create a 4‑digit PIN to lock your incognito session."
      : "Enter your 4‑digit PIN to unlock incognito mode.";

  const isMerging = mergePhase === "merging";
  const isSuccess = mergePhase === "success";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all duration-300 ${
          isShaking ? "pin-shake" : ""
        }`}
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
        }}
      >
        <h2
          className="mb-2 text-2xl font-black tracking-[-0.04em]"
          style={{ color: "#183b32" }}
        >
          {title}
        </h2>

        <p className="mb-6 text-sm font-medium" style={{ color: "#2f5b4d" }}>
          {description}
        </p>

        {/* ── PIN inputs / merge finale ── */}
        <div
          className={`mb-4 flex justify-center transition-all duration-300 ${
            isMerging || isSuccess ? "pin-merge-container" : "gap-3"
          }`}
        >
          {pin.map((digit, idx) => {
            const isFilled = digit !== "";
            const isAnimated = animatedIndex === idx;

            // During merge/success, hide all inputs — they collapse away
            if (isMerging || isSuccess) {
              return (
                <div
                  key={idx}
                  className={`pin-merge h-16 w-14 rounded-2xl border-2 bg-white transition-all duration-300 ${
                    isAnimated ? "pin-digit-enter" : ""
                  }`}
                  style={{
                    borderColor: isFilled ? "#183b32" : "#8fb59c",
                    boxShadow: isFilled
                      ? "0 0 0 3px rgba(212,107,148,0.3)"
                      : "none",
                  }}
                />
              );
            }

            return (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`h-16 w-14 rounded-2xl border-2 bg-white text-center text-3xl font-black outline-none transition-all duration-200 ${
                  isAnimated ? "pin-digit-enter" : ""
                }`}
                style={{
                  borderColor: isFilled ? "#183b32" : "#8fb59c",
                  color: "#183b32",
                  boxShadow: isFilled
                    ? "0 0 0 3px rgba(212,107,148,0.3)"
                    : "none",
                }}
              />
            );
          })}

          {/* ── Success checkmark overlay ── */}
          {isSuccess && (
            <div className="relative flex items-center justify-center">
              {/* Pulsing glow ring */}
              <div className="pin-success-ring absolute inset-0 rounded-2xl border-2 border-[#88ce8d]" />

              {/* Checkmark */}
              <svg
                className="pin-checkmark-svg"
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="24" cy="24" r="22" fill="#88ce8d" fillOpacity="0.15" />
                <circle cx="24" cy="24" r="22" stroke="#88ce8d" strokeWidth="2" />
                <path
                  className="pin-checkmark-path"
                  d="M14 24 L21 31 L34 17"
                  stroke="#286b35"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          )}
        </div>

        {error && (
          <p className="mb-4 text-center text-sm font-bold" style={{ color: "#d46b94" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="rounded-xl px-5 py-2.5 text-sm font-bold transition hover:bg-[#8fb59c]/20"
            style={{ color: "#2f5b4d" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
