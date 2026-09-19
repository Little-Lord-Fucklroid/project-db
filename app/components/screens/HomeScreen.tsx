"use client";

import type { MoodEntry } from "@/lib/moodStorage";
import type { Memory } from "@/lib/memory";

export default function HomeScreen({
  onNavigateToChat,
  onNavigateToMood,
  onNavigateToMemory,
  onNavigateToInsights,
  onNavigateToInsight,
  todayMood,
  brainSummary,
  memories,
  userName,
}: {
  onNavigateToChat: () => void;
  onNavigateToMood: () => void;
  onNavigateToMemory: () => void;
  onNavigateToInsights?: () => void;
  onNavigateToInsight?: () => void;
  todayMood: MoodEntry | null;
  brainSummary: string;
  memories: Memory[];
  userName?: string;
}) {
  return (
    <main
      className="min-h-screen w-full relative overflow-hidden flex flex-col items-center"
      style={{
        background:
          "linear-gradient(160deg, #f5e6fa 0%, #e8d0f5 25%, #dcbce8 50%, #e6d5fa 75%, #f0e0f8 100%)",
      }}
    >
      {/* Soft cloud blobs */}
      <div
        className="absolute top-[-10%] left-[-20%] w-[600px] h-[500px] rounded-full opacity-70 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(210,160,240,0.55) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[10%] right-[-20%] w-[500px] h-[450px] rounded-full opacity-60 blur-[110px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(220,190,245,0.5) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[30%] left-[15%] w-[300px] h-[300px] rounded-full opacity-40 blur-[90px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(230,200,255,0.45) 0%, transparent 70%)" }}
      />

      {/* Header: Mindora branding */}
      <div className="relative z-10 w-full px-6 pt-14 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#a070d0] to-[#8a5fc0] flex items-center justify-center shadow-lg shadow-[#8a5fc0]/30">
          <span className="text-xl">🧠</span>
        </div>
        <h2 className="text-[15px] font-black tracking-tight text-[#4a2b6e] leading-none">
          Mindora
        </h2>
      </div>

      {/* Title */}
      <div className="relative z-10 text-center px-6 mt-2">
        <h1 className="text-[34px] sm:text-[42px] font-black text-[#2d1b3a] leading-[1.05] tracking-tight">
          Your Mind
          <br />
          Understood by AI.
        </h1>
        <p className="text-[#7a6095] text-[15px] font-medium mt-4 max-w-[320px] mx-auto leading-relaxed">
          Talk, reflect, and heal with your personal AI companion.
        </p>
      </div>

      {/* Large yellow smiley emoji with heart eyes */}
      <div className="relative z-10 mt-10 flex items-center justify-center">
        <div className="relative">
          {/* Floating small emoji characters */}
          <div className="absolute -left-16 top-4 float-anim">
            <span className="text-4xl">😟</span>
          </div>
          <div className="absolute -right-14 top-8 float-anim" style={{ animationDelay: "-2s" }}>
            <span className="text-4xl">😡</span>
          </div>
          <div className="absolute left-4 -bottom-6 float-anim" style={{ animationDelay: "-3.5s" }}>
            <span className="text-2xl">💜</span>
          </div>

          <div
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center shadow-[0_30px_80px_rgba(255,200,50,0.45)] relative"
            style={{
              background:
                "linear-gradient(135deg, #ffe066 0%, #ffd23f 40%, #ffbf2e 60%, #ffcc3d 100%)",
              boxShadow:
                "inset -8px -12px 30px rgba(255,255,255,0.6), inset 8px 8px 24px rgba(255,180,30,0.35), 0 24px 60px rgba(255,200,50,0.6)",
            }}
          >
            <span className="text-[72px] sm:text-[88px] leading-none select-none">😍</span>
          </div>
        </div>
      </div>

      {/* "I Feel love" pill tag */}
      <div className="relative z-10 mt-6 flex justify-center">
        <span
          className="inline-block rounded-full px-5 py-2 text-sm font-extrabold text-[#5a3d2a] shadow-md"
          style={{
            background: "linear-gradient(135deg, #fff5d6 0%, #ffe8b3 100%)",
            boxShadow: "0 4px 20px rgba(255,200,80,0.35)",
            border: "1px solid rgba(255,220,160,0.6)",
          }}
        >
          I Feel love
        </span>
      </div>

      {/* Spacer to push button down */}
      <div className="flex-1" />

      {/* Insights entry button (visible link to center screen) */}
      {onNavigateToInsights && (
        <button
          onClick={onNavigateToInsights}
          className="relative z-10 mb-4 mx-6 w-[calc(100%-48px)] max-w-[380px] rounded-[24px] px-5 py-3 text-sm font-extrabold text-[#5a3d7a] bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:bg-white/60 hover:scale-[1.01] transition-all duration-200 text-left tracking-tight"
        >
          📊 Your Mental Insights →
        </button>
      )}

      {/* Right screenshot insight entry */}
      {onNavigateToInsight && (
        <button
          onClick={onNavigateToInsight}
          className="relative z-10 mb-4 mx-6 w-[calc(100%-48px)] max-w-[380px] rounded-[24px] px-5 py-3 text-sm font-extrabold text-[#8a5fc0] bg-gradient-to-r from-[#e8d5f5] to-[#f5e6fa] backdrop-blur-md border border-white/60 shadow-sm hover:scale-[1.01] transition-all duration-200 text-left tracking-tight"
        >
          📈 Your Insight →
        </button>
      )}

      {/* Large purple gradient Get Started button */}
      <button
        onClick={onNavigateToChat}
        aria-label="Get Started"
        className="relative z-10 mb-14 mx-6 w-[calc(100%-48px)] max-w-[380px] rounded-[32px] py-5 text-xl font-black text-white shadow-[0_20px_60px_rgba(120,60,180,0.45)] hover:scale-[1.02] hover:shadow-[0_26px_70px_rgba(120,60,180,0.55)] active:scale-[0.98] transition-all duration-300 tracking-tight"
        style={{
          background:
            "linear-gradient(135deg, #8b5ccf 0%, #6d3ba8 50%, #9b6de0 100%)",
          boxShadow: "0 20px 60px rgba(120,60,180,0.45), inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      >
        Get Started
      </button>
    </main>
  );
}
