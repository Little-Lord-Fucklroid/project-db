"use client";

type IncognitoPulseProps = {
  size?: number;
  active?: boolean;
};

export default function IncognitoPulse({ size = 70, active = true }: IncognitoPulseProps) {
  if (!active) return null;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer pulse ring — starts first, slowest */}
      <div className="incognito-pulse-ring incognito-pulse-ring-1" />

      {/* Middle pulse ring — delayed */}
      <div className="incognito-pulse-ring incognito-pulse-ring-2" />

      {/* Inner pulse ring — most delayed */}
      <div className="incognito-pulse-ring incognito-pulse-ring-3" />

      {/* Soft glowing circle */}
      <div className="incognito-pulse-glow" />

      {/* Solid center pin */}
      <div className="incognito-pulse-pin" />
    </div>
  );
}
