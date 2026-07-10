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
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(0, 1);
    setPin(newPin);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // If all 4 digits are filled, submit
    if (newPin.every((d) => d !== "")) {
      const fullPin = newPin.join("");
      setError("");
      onSuccess(fullPin);
    }
  };

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
    setPin(["", "", "", ""]);
    setError("");
    onCancel();
  };

  const title = mode === "create" ? "Set Incognito PIN" : "Enter PIN";
  const description =
    mode === "create"
      ? "Create a 4‑digit PIN to lock your incognito session."
      : "Enter your 4‑digit PIN to unlock incognito mode.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-sm rounded-3xl p-6 shadow-2xl"
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

        <div className="mb-4 flex justify-center gap-3">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="h-16 w-14 rounded-2xl border-2 bg-white text-center text-3xl font-black outline-none transition"
              style={{
                borderColor: digit ? "#183b32" : "#8fb59c",
                color: "#183b32",
                boxShadow: digit ? "0 0 0 3px rgba(212,107,148,0.3)" : "none",
              }}
            />
          ))}
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