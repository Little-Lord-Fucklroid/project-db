"use client";

export default function MentalInsightsScreen({
  onBack,
}: {
  onBack?: () => void;
}) {
  return (
    <main
      className="min-h-screen w-full relative overflow-hidden flex flex-col"
      style={{
        background:
          "linear-gradient(160deg, #f5e6fa 0%, #e8d0f5 25%, #dcbce8 50%, #e6d5fa 75%, #f0e0f8 100%)",
      }}
    >
      {/* Soft cloud blobs */}
      <div
        className="absolute top-[-15%] left-[-20%] w-[600px] h-[500px] rounded-full opacity-60 blur-[120px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(210,160,240,0.5) 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[5%] right-[-20%] w-[500px] h-[450px] rounded-full opacity-50 blur-[110px] pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(220,190,245,0.45) 0%, transparent 70%)" }}
      />

      {/* Header */}
      <header className="relative z-10 px-5 pt-14 pb-3 flex items-center justify-between">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-[#4a2b6e] hover:bg-white/80 transition-colors"
        >
          <span className="text-lg font-black leading-none">←</span>
        </button>

        <h1 className="absolute left-1/2 -translate-x-1/2 text-[22px] font-black text-[#2d1b3a] tracking-tight leading-none">
          Your Mental Insights
        </h1>

        <button
          aria-label="Menu"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/50 backdrop-blur-md border border-white/60 shadow-sm text-[#4a2b6e] hover:bg-white/80 transition-colors"
        >
          <span className="text-base font-black leading-none">⋯</span>
        </button>
      </header>

      {/* Content */}
      <div className="relative z-10 px-4 pt-2 pb-8 space-y-5 flex-1 overflow-y-auto">
        {/* Mood Trend */}
        <section className="glass-card rounded-[28px] p-5 shadow-[0_12px_40px_rgba(120,60,180,0.12)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-extrabold text-[#3a1e5e] tracking-tight">Mood Trend</h2>
            <span className="text-[11px] font-extrabold text-[#8a6fb0] bg-white/60 rounded-full px-3 py-0.5 backdrop-blur-sm border border-white/50">7 days</span>
          </div>

          {/* Chart area */}
          <div className="relative w-full h-[140px] mb-3">
            <svg viewBox="0 0 280 100" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid lines */}
              <line x1="0" y1="25" x2="280" y2="25" stroke="#ddd6f0" strokeWidth="1" />
              <line x1="0" y1="50" x2="280" y2="50" stroke="#ddd6f0" strokeWidth="1" />
              <line x1="0" y1="75" x2="280" y2="75" stroke="#ddd6f0" strokeWidth="1" />

              {/* Purple line */}
              <polyline
                fill="none"
                stroke="#9b7ce0"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="10,55 50,35 90,20 130,40 170,60 210,30 250,45 270,70"
              />

              {/* Dots */}
              <circle cx="10" cy="55" r="4" fill="#9b7ce0" />
              <circle cx="50" cy="35" r="4" fill="#9b7ce0" />
              <circle cx="90" cy="20" r="4" fill="#9b7ce0" />
              <circle cx="130" cy="40" r="4" fill="#9b7ce0" />
              <circle cx="170" cy="60" r="4" fill="#9b7ce0" />
              <circle cx="210" cy="30" r="4" fill="#9b7ce0" />
              <circle cx="250" cy="45" r="4" fill="#9b7ce0" />

              {/* Happy label dot (green) */}
              <circle cx="90" cy="20" r="6" fill="#4cd964" />
              <text x="90" y="10" textAnchor="middle" fill="#4cd964" fontSize="8" fontWeight="800" fontFamily="sans-serif">Happy</text>

              {/* Sad label dot (yellow) */}
              <circle cx="210" cy="30" r="6" fill="#ffd23f" />
              <text x="210" y="18" textAnchor="middle" fill="#ffbf2e" fontSize="8" fontWeight="800" fontFamily="sans-serif">Sad</text>
            </svg>
          </div>

          {/* Day labels */}
          <div className="flex justify-between text-[10px] font-extrabold text-[#b8a0d0] tracking-wide uppercase px-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
              <span key={d} className="w-[34px] text-center">{d}</span>
            ))}
          </div>
        </section>

        {/* Two column cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stress Level */}
          <section
            className="rounded-[28px] p-4 shadow-[0_10px_35px_rgba(240,120,50,0.2)]"
            style={{ background: "linear-gradient(135deg, #ff9a6e 0%, #ff7848 100%)" }}
          >
            <h3 className="text-[13px] font-extrabold text-white tracking-tight mb-1">Stress Level</h3>
            <div className="flex items-end gap-1 h-[60px]">
              {[35,45,30,70,55,45,40].map((h,i) => (
                <div key={i} className="flex-1 rounded-t-lg bg-white/30 backdrop-blur-sm" style={{ height: `${h}%`, minHeight: 4 }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-extrabold text-white/90 mt-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </section>

          {/* Impact */}
          <section
            className="glass-card rounded-[28px] p-4 shadow-[0_10px_35px_rgba(120,60,180,0.15)]"
            style={{ background: "linear-gradient(135deg, #b090f0 0%, #8a6fd0 100%)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-extrabold text-white tracking-tight">Impact</h3>
              <span className="text-[10px] font-extrabold text-white/80 bg-white/20 rounded-full px-2 py-0.5">High</span>
            </div>
            {/* Small grid of squares */}
            <div className="grid grid-cols-6 gap-[3px]">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[4px] bg-white/20 backdrop-blur-sm"
                  style={{ opacity: Math.random() > 0.4 ? 0.85 : 0.4 }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* Sleep Quality */}
        <section className="glass-card rounded-[28px] p-5 shadow-[0_12px_40px_rgba(120,60,180,0.1)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[15px] font-extrabold text-[#3a1e5e] tracking-tight">Sleep Quality</h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#8a6fb0] bg-white/50 rounded-full px-3 py-0.5 backdrop-blur-sm border border-white/40">6.8 hr/day</span>
            </div>
          </div>

          <div className="relative w-full h-[50px]">
            <svg viewBox="0 0 280 50" className="w-full h-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#4cd964"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points="10,30 50,20 90,35 130,15 170,25 210,10 250,30 270,18"
              />
            </svg>
          </div>
        </section>
      </div>
    </main>
  );
}
