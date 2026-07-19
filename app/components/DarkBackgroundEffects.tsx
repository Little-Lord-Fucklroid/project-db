"use client";

import { useEffect, useRef } from "react";

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => { mouse.current = { x: e.clientX, y: e.clientY }; });

    const COLORS = ["rgba(125,212,171,", "rgba(240,160,188,", "rgba(200,170,240,", "rgba(255,255,255,"];
    type P = { x: number; y: number; vx: number; vy: number; size: number; life: number; max: number; tw: number; col: string };
    const make = (): P => ({ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight, vx: (Math.random() - 0.5) * 0.4, vy: -Math.random() * 0.3 - 0.1, size: Math.random() * 2 + 0.5, life: 0, max: Math.random() * 280 + 150, tw: Math.random() * Math.PI * 2, col: COLORS[Math.floor(Math.random() * COLORS.length)] });
    const ps: P[] = Array.from({ length: 80 }, () => { const p = make(); p.life = Math.random() * p.max; return p });

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouse.current;
      if (mx) { const g = ctx.createRadialGradient(mx, my, 0, mx, my, 200); g.addColorStop(0, "rgba(125,212,171,0.06)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      for (const p of ps) {
        p.life++; p.x += p.vx; p.y += p.vy; p.tw += 0.045; p.vx *= 0.999; p.vy *= 0.999;
        if (mx) { const dx = mx - p.x, dy = my - p.y, d = Math.hypot(dx, dy); if (d < 220 && d > 0) { p.vx += dx / d * 0.003; p.vy += dy / d * 0.003; } }
        const t = p.life / p.max;
        const a = (t < 0.2 ? t / 0.2 : t > 0.75 ? (1 - t) / 0.25 : 1) * (0.5 + 0.5 * Math.sin(p.tw)) * 0.6;
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
        gr.addColorStop(0, p.col + a + ")"); gr.addColorStop(1, p.col + "0)");
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2); ctx.fillStyle = p.col + Math.min(a * 2, 1) + ")"; ctx.fill();
        if (p.life >= p.max) Object.assign(p, make());
      }
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const d = Math.hypot(ps[i].x - ps[j].x, ps[i].y - ps[j].y);
        if (d < 85) { ctx.beginPath(); ctx.strokeStyle = `rgba(200,210,230,${(1 - d / 85) * 0.1})`; ctx.lineWidth = 0.4; ctx.moveTo(ps[i].x, ps[i].y); ctx.lineTo(ps[j].x, ps[j].y); ctx.stroke(); }
      }
      raf.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }} />;
}

// ─── Aurora ───────────────────────────────────────────────────────────────────
function Aurora() {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0.5, y: 0.5 });
  const cur = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    window.addEventListener("mousemove", e => { target.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }; });
    let raf = 0;
    const tick = () => {
      cur.current.x += (target.current.x - cur.current.x) * 0.04;
      cur.current.y += (target.current.y - cur.current.y) * 0.04;
      if (ref.current) {
        const { x, y } = cur.current;
        ref.current.style.background = `
          radial-gradient(ellipse 70% 60% at ${x * 100}% ${y * 100}%, rgba(125,212,171,0.22) 0%, transparent 60%),
          radial-gradient(ellipse 65% 75% at ${100 - x * 100}% ${100 - y * 100}%, rgba(240,160,188,0.18) 0%, transparent 55%),
          radial-gradient(ellipse 40% 40% at 50% 55%, rgba(160,120,220,0.08) 0%, transparent 65%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}

// ─── Desktop Blobs ────────────────────────────────────────────────────────────
function Blobs() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
      <div className="blob blob-1" /><div className="blob blob-2" />
      <div className="blob blob-3" /><div className="blob blob-4" />
    </div>
  );
}

export default function DarkBackgroundEffects() {
  return (
    <>
      <Aurora />
      <Blobs />
      <ParticleCanvas />
    </>
  );
}