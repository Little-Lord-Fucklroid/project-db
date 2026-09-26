"use client";

import { useState, useEffect } from "react";

export default function InsightScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch("/api/analytics/insight")
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics({ emotionBars: { sick: 10, angry: 25, sad: 40, calm: 70, happy: 90 }, dominateMood: { label: "Happy", score: 72 } }));
  }, []);
  return (
    <main
      className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #f0e6fa 0%, #e8d5f5 25%, #dcbce8 50%, #e6d5fa 75%, #f0e0f8 100%)",
      }}
    >
      {/* Soft blob background */}
      <div
        className="absolute top-[-10%] left-[-20%] w-[500px] h-[500px] rounded-full opacity-50 blur-[100px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(210,160,240,0.45) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[15%] right-[-15%] w-[450px] h-[450px] rounded-full opacity-40 blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(230,200,255,0.4) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <header className="relative z-10 px-5 pt-14 pb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-md border border-white/50 shadow-sm text-[#4a2b6e] hover:bg-white/70 transition-colors"
        >
          <span className="text-xl font-black leading-none">←</span>
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[20px] font-black text-[#3a1e5e] tracking-tight leading-none">
          Your Insight
        </h1>
        <button
          aria-label="Notifications"
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/40 backdrop-blur-md border border-white/50 shadow-sm text-[#4a2b6e] hover:bg-white/70 transition-colors"
        >
          <span className="text-lg">🔔</span>
        </button>
      </header>

      {/* Week / Month / Year tabs */}
      <div className="relative z-10 px-8 pt-1 pb-4 flex items-center justify-center gap-8">
        <button className="text-[15px] font-black text-[#5a3d7a] tracking-tight border-b-2 border-[#8a6fb0] pb-0.5">
          Week
        </button>
        <button className="text-[15px] font-medium text-[#b8a0d0] tracking-tight hover:text-[#8a6fb0] transition-colors">
          Month
        </button>
        <button className="text-[15px] font-medium text-[#b8a0d0] tracking-tight hover:text-[#8a6fb0] transition-colors">
          Year
        </button>
      </div>

      {/* Main content */}
      <div className="relative z-10 px-6 flex-1 flex flex-col items-center pt-2 pb-8 overflow-y-auto">
        {/* Yellow happy character */}
        <div className="relative mt-2 mb-6 flex flex-col items-center">
          <div
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex items-center justify-center shadow-[0_20px_60px_rgba(255,210,50,0.5)] relative"
            style={{
              background:
                "linear-gradient(135deg, #ffea5a 0%, #ffd23f 40%, #ffc233 60%, #ffdd3d 100%)",
              boxShadow:
                "inset -6px -10px 24px rgba(255,255,255,0.6), inset 6px 6px 18px rgba(255,190,20,0.35), 0 20px 50px rgba(255,210,50,0.55)",
            }}
          >
            <span className="text-[64px] sm:text-[80px] leading-none select-none">🐥</span>
          </div>
        </div>

        {/* Happy label */}
        <h2 className="text-[22px] font-black text-[#2d1b3a] tracking-tight mb-2">Happy</h2>

        {/* Emotion bar chart */}
        <div className="w-full max-w-[340px] mb-8">
          <div className="flex items-end justify-between gap-2 h-[80px] mb-3">
                        {Object.entries(analytics?.emotionBars || { sick: 10, angry: 25, sad: 40, calm: 70, happy: 90 }).map(([name, val]: [string, any]) => (
              <div key={name} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-[#c8aee8] to-[#d6bef5] backdrop-blur-sm"
                  style={{ height: `${Number(val) || 0}%`, minHeight: 12 }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between px-0.5">
            {Object.entries(analytics?.emotionBars || { sick: 10, angry: 25, sad: 40, calm: 70, happy: 90 }).map(([label, val]) => (
              <span key={label} className="text-[10px] font-extrabold text-[#b8a0d0] tracking-wide uppercase text-center w-[20%] capitalize">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Day strip */}
        <div className="flex justify-between w-full max-w-[300px] mb-6 px-1">
          {["M","T","W","Th","F","Sa","Su"].map((d, i) => (
            <span key={i} className="text-[11px] font-extrabold text-[#b8a0d0] tracking-widest w-8 text-center">{d}</span>
          ))}
        </div>

        {/* Dominate Mood */}
        <section className="w-full max-w-[340px] rounded-[28px] p-5 shadow-[0_12px_40px_rgba(120,60,180,0.1)] bg-white/35 backdrop-blur-xl border border-white/50 mb-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[16px] font-black text-[#3a1e5e] tracking-tight">Dominate Mood</h3>
            <span className="text-[22px] font-black text-[#2d1b3a] tracking-tight">{analytics?.dominateMood?.score || 72} <span className="text-[13px] font-extrabold text-[#8a6fb0]">/ 100</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
              <img
                src="https://i.pravatar.cc/150?img=28"
                alt="Mood avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="text-[15px] font-black text-[#2d1b3a] tracking-tight">{analytics?.dominateMood?.label || "Happy"}</h4>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#a070d0] to-[#8a5fc0] flex items-center justify-center shadow-md">
                  <span className="text-[10px] text-white font-black">💬</span>
                </span>
                <div className="flex-1 h-1 rounded-full bg-[#e8d5f5] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#9b7ce0] to-[#6d3ba8]" style={{ width: `${analytics?.dominateMood?.score || 72}%` }} />
                </div>
                <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#b49ae0] to-[#9a7bc8] flex items-center justify-center shadow-md">
                  <span className="text-[10px] text-white font-black">📊</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom nav icons - liquid glass */}
        <nav className="glass-card w-[92vw] sm:max-w-[340px] max-w-[340px] mt-4 rounded-[28px] px-4 sm:px-5 py-3 flex items-center justify-between shadow-[0_16px_50px_rgba(120,60,180,0.25)] border border-white/60 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(120,60,180,0.35)]">
          <button className="flex flex-col items-center gap-1 text-[#5a3d7a] hover:text-[#6a4da8] transition-colors shrink-0" aria-label="Mail">
            <span className="text-lg sm:text-xl">✉️</span>
            <span className="text-[10px] sm:text-[9px] font-extrabold tracking-wide">Mail</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5a3d7a] hover:text-[#6a4da8] transition-colors shrink-0" aria-label="Stats">
            <span className="text-lg sm:text-xl">📊</span>
            <span className="text-[10px] sm:text-[9px] font-extrabold tracking-wide">Stats</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5a3d7a] hover:text-[#6a4da8] transition-colors shrink-0" aria-label="Camera">
            <span className="text-lg sm:text-xl">📹</span>
            <span className="text-[10px] sm:text-[9px] font-extrabold tracking-wide">Cam</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#5a3d7a] hover:text-[#6a4da8] transition-colors shrink-0" aria-label="Profile">
            <span className="text-lg sm:text-xl">👤</span>
            <span className="text-[10px] sm:text-[9px] font-extrabold tracking-wide">Profile</span>
          </button>
        </nav>
      </div>
    </main>
  );
}
