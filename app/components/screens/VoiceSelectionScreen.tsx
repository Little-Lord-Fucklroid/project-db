"use client";

import { useState } from "react";
import DarkBackgroundEffects from "../DarkBackgroundEffects";

type VoiceSelectionScreenProps = {
  onSelect: (voice: string) => void;
  darkMode?: boolean;
};

const VOICES = [
  { id: "en-US-AvaNeural", label: "Ava", description: "Warm, friendly, always supportive" },
  { id: "en-US-AnaNeural", label: "Ana", description: "Calm, clear, gentle" },
  { id: "en-US-AndrewMultilingualNeural", label: "Andrew", description: "Confident, clear, male voice" },
  { id: "en-US-EmmaMultilingualNeural", label: "Emma", description: "Bright, expressive, premium" },
];

const SAMPLE_TEXT = "I'm Vibe. Let's talk about how you're feeling today.";

export default function VoiceSelectionScreen({
  onSelect,
  darkMode = false,
}: VoiceSelectionScreenProps) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const playPreview = async (voiceId: string) => {
    setPreviewing(voiceId);
    setLoading(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: SAMPLE_TEXT, voice: voiceId }),
      });

      if (!response.ok) {
        throw new Error("Preview failed.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewing(null);
        setLoading(false);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        setPreviewing(null);
        setLoading(false);
        alert("Could not play preview. Please try again.");
      };
    } catch (error) {
      console.error("Preview failed:", error);
      setPreviewing(null);
      setLoading(false);
      alert("Preview playback failed. Please try again.");
    }
  };

  const selectVoice = (voiceId: string) => {
    onSelect(voiceId);
  };

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{
        background: darkMode ? "#060610" : "#f7faf3",
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Background effects */}
      {darkMode ? (
        <DarkBackgroundEffects />
      ) : (
        <>
          <div className="mesh-bg" />
          <div className="light-ray opacity-30" />
        </>
      )}

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <img
            src="/mine_heart_nobg.png"
            alt="Vibe"
            className="w-20 h-20 shimmer-heart mb-5 mx-auto"
          />
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: darkMode ? "rgba(255,255,255,0.92)" : "#191d18",
              marginBottom: "8px",
            }}
          >
            Choose Your Voice
          </h1>
          <p
            style={{
              color: darkMode ? "rgba(255,255,255,0.4)" : "#40493f",
              fontSize: "16px",
              opacity: darkMode ? 0.75 : 0.75,
            }}
          >
            Pick the voice that feels right for you.
          </p>
        </div>

        <div className="space-y-4">
          {VOICES.map((voice) => (
            <div
              key={voice.id}
              className="rounded-[32px] p-6 space-y-4"
              style={{
                background: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.45)",
                backdropFilter: darkMode ? "blur(20px)" : "blur(20px)",
                WebkitBackdropFilter: darkMode ? "blur(20px)" : "blur(20px)",
                border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.5)",
                boxShadow: darkMode
                  ? "0 16px 60px rgba(0,0,0,0.4)"
                  : "0 16px 50px rgba(40,107,53,0.08)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 style={{ fontWeight: 700, fontSize: "20px", color: darkMode ? "rgba(255,255,255,0.92)" : "#191d18" }}>
                    {voice.label}
                  </h2>
                  <p style={{ fontSize: "13px", color: darkMode ? "rgba(255,255,255,0.3)" : "#707a6e" }}>
                    {voice.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => playPreview(voice.id)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "16px",
                    background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)",
                    border: darkMode ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    color: darkMode ? "rgba(255,255,255,0.9)" : "#191d18",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading && previewing !== voice.id ? 0.6 : 1,
                  }}
                >
                  {previewing === voice.id ? "Playing..." : "▶ Preview"}
                </button>

                <button
                  onClick={() => selectVoice(voice.id)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "16px",
                    background: darkMode
                      ? "linear-gradient(135deg, #7dd4ab 0%, #c0a0d8 40%, #f0a0bc 100%)"
                      : "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)",
                    border: "none",
                    fontWeight: 700,
                    color: darkMode ? "rgba(8,6,16,0.95)" : "#115925",
                    boxShadow: darkMode
                      ? "0 4px 20px rgba(125,212,171,0.25), 0 2px 10px rgba(240,160,188,0.15)"
                      : "0 4px 16px rgba(136,206,141,0.3)",
                    cursor: "pointer",
                  }}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center mt-6" style={{ color: darkMode ? "rgba(255,255,255,0.3)" : "#707a6e", fontSize: "13px" }}>
          You can change this later in settings.
        </p>
      </div>
    </main>
  );
}
