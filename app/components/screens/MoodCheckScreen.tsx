"use client";

import { useState } from "react";
import {
  saveTodayMood,
  type MoodEntry,
} from "@/lib/moodStorage";

type MoodCheckScreenProps = {
  onComplete: (mood: MoodEntry | null) => void;
};

const moods = [
  {
    label: "calm",
    emoji: "🌿",
    subtitle: "soft and steady",
  },
  {
    label: "happy",
    emoji: "✨",
    subtitle: "light and good",
  },
  {
    label: "anxious",
    emoji: "🫧",
    subtitle: "mind is loud",
  },
  {
    label: "sad",
    emoji: "🌧️",
    subtitle: "heavy today",
  },
  {
    label: "angry",
    emoji: "🔥",
    subtitle: "heated inside",
  },
  {
    label: "flirty",
    emoji: "😏",
    subtitle: "feeling playful",
  },
];

export default function MoodCheckScreen({
  onComplete,
}: MoodCheckScreenProps) {
  const [selectedMood, setSelectedMood] = useState("");
  const [intensity, setIntensity] = useState(3);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSaveMood() {
    if (!selectedMood) {
      setErrorMessage("Pick how you feel first.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      const savedMood = await saveTodayMood(
        selectedMood,
        intensity,
        note
      );

      onComplete(savedMood);
    } catch (error) {
      console.error("Mood save failed:", error);

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Could not save mood.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: "#f7faf3" }}
    >
      <div className="mesh-bg" />
      <div className="light-ray opacity-30" />

      <div
        style={{
          position: "absolute",
          width: "260px",
          height: "260px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(172,244,175,0.42), transparent 70%)",
          top: "8%",
          right: "-90px",
          filter: "blur(4px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: "220px",
          height: "220px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(136,206,141,0.26), transparent 70%)",
          bottom: "10%",
          left: "-80px",
          filter: "blur(4px)",
        }}
      />

      <div
        className="w-full max-w-md z-10"
        style={{
          animation: "fadeIn 0.45s ease-out",
        }}
      >
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src="/mine_heart_nobg.png"
            alt="Vibe"
            className="w-20 h-20 shimmer-heart mb-5"
          />

          <p
            style={{
              color: "#286b35",
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            daily vibe check
          </p>

          <h1
            style={{
              fontSize: "32px",
              fontWeight: 900,
              color: "#191d18",
              marginBottom: "10px",
              lineHeight: 1.05,
            }}
          >
            How are you feeling today?
          </h1>

          <p
            style={{
              color: "#40493f",
              fontSize: "16px",
              opacity: 0.75,
              lineHeight: 1.5,
            }}
          >
            This helps Vibe understand your energy before
            you start talking.
          </p>
        </div>

        <div
          className="glass-card rounded-[34px] p-6"
          style={{
            boxShadow: "0 18px 60px rgba(40,107,53,0.10)",
            border: "1px solid rgba(255,255,255,0.72)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            {moods.map((mood) => {
              const isSelected = selectedMood === mood.label;

              return (
                <button
                  key={mood.label}
                  type="button"
                  onClick={() => {
                    setSelectedMood(mood.label);
                    setErrorMessage("");
                  }}
                  style={{
                    position: "relative", // NEW: needed for the badge
                    padding: "16px 14px",
                    borderRadius: "22px",
                    background: isSelected
                      ? "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)"
                      : "rgba(255,255,255,0.62)",
                    border: isSelected
                      ? "1px solid rgba(40,107,53,0.25)"
                      : "1px solid rgba(255,255,255,0.75)",
                    boxShadow: isSelected
                      ? "0 10px 28px rgba(136,206,141,0.35)"
                      : "0 8px 24px rgba(25,29,24,0.04)",
                    cursor: "pointer",
                    textAlign: "left",
                    transform: isSelected
                      ? "translateY(-2px)"
                      : "translateY(0)",
                    transition: "all 0.18s ease",
                  }}
                >
                  {/* --- NEW: Recommended badge for flirty mood --- */}
                  {mood.label === "flirty" && (
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#d46b94",
                        color: "white",
                        fontSize: "9px",
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: "999px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        opacity: 0.85,
                      }}
                    >
                      Recommended
                    </span>
                  )}

                  <div
                    style={{
                      fontSize: "26px",
                      marginBottom: "8px",
                    }}
                  >
                    {mood.emoji}
                  </div>

                  <div
                    style={{
                      color: "#191d18",
                      fontWeight: 850,
                      fontSize: "16px",
                      textTransform: "capitalize",
                      marginBottom: "4px",
                    }}
                  >
                    {mood.label}
                  </div>

                  <div
                    style={{
                      color: "#40493f",
                      fontSize: "12px",
                      opacity: 0.7,
                      fontWeight: 600,
                    }}
                  >
                    {mood.subtitle}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <label
                style={{
                  color: "#191d18",
                  fontWeight: 850,
                  fontSize: "15px",
                }}
              >
                Intensity
              </label>

              <span
                style={{
                  color: "#286b35",
                  fontWeight: 900,
                  fontSize: "14px",
                }}
              >
                {intensity}/5
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={(event) =>
                setIntensity(Number(event.target.value))
              }
              style={{
                width: "100%",
                accentColor: "#88ce8d",
                cursor: "pointer",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#707a6e",
                fontWeight: 700,
                marginTop: "4px",
              }}
            >
              <span>low</span>
              <span>strong</span>
            </div>
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Want to add a quick note? optional"
            rows={3}
            style={{
              width: "100%",
              marginTop: "22px",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.75)",
              background: "rgba(255,255,255,0.65)",
              padding: "16px",
              color: "#191d18",
              outline: "none",
              resize: "none",
              fontSize: "15px",
              lineHeight: 1.45,
            }}
          />

          {errorMessage && (
            <p
              style={{
                color: "#dc2626",
                fontSize: "14px",
                fontWeight: 700,
                marginTop: "12px",
              }}
            >
              {errorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveMood}
            disabled={saving}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "16px 24px",
              borderRadius: "20px",
              background:
                "linear-gradient(135deg, #88ce8d 0%, #acf4af 100%)",
              color: "#115925",
              fontWeight: 900,
              fontSize: "17px",
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.65 : 1,
              boxShadow:
                "0 10px 32px rgba(136, 206, 141, 0.38)",
            }}
          >
            {saving ? "Saving..." : "Start chatting"}
          </button>

          <button
            type="button"
            onClick={() => onComplete(null)}
            disabled={saving}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "10px",
              background: "transparent",
              border: "none",
              color: "#707a6e",
              fontSize: "14px",
              fontWeight: 800,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}