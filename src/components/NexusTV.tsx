'use client';

import { useState, useEffect, useRef } from "react";
import type { NexusMode } from "@/types/nexus";
import { useNexusData } from "@/hooks/useNexusData";
import { useNexusSocket } from "@/hooks/useNexusSocket";

// ─── TIME (clock + greeting only; mode comes from useNexusData + mode engine) ───
const getTimeData = () => {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  return {
    hours: h,
    minutes: m,
    timeStr: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
    dateStr: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    greeting: h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night",
  };
};

const modeConfig: Record<NexusMode, { label: string; icon: string; color: string; bg: string }> = {
  morning: { label: "Morning", icon: "☀️", color: "#f59e0b", bg: "radial-gradient(ellipse at 30% 80%, rgba(245,158,11,0.04) 0%, transparent 60%)" },
  focus: { label: "Focus", icon: "🎯", color: "#06b6d4", bg: "radial-gradient(ellipse at 70% 30%, rgba(6,182,212,0.03) 0%, transparent 60%)" },
  home: { label: "Home", icon: "🏠", color: "#10b981", bg: "radial-gradient(ellipse at 50% 60%, rgba(16,185,129,0.03) 0%, transparent 60%)" },
  evening: { label: "Evening", icon: "🌅", color: "#8b5cf6", bg: "radial-gradient(ellipse at 40% 40%, rgba(139,92,246,0.03) 0%, transparent 60%)" },
  weekend: { label: "Weekend", icon: "🏈", color: "#f59e0b", bg: "radial-gradient(ellipse at 60% 50%, rgba(245,158,11,0.03) 0%, transparent 60%)" },
  night: { label: "Night", icon: "🌙", color: "#6366f1", bg: "radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.02) 0%, transparent 60%)" },
};

function formatSignalTime(iso: string) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const diff = Date.now() - d.getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// ─── BREATHING DOT ───
const BreathDot = ({ color, size = 6 }: { color: string; size?: number }) => (
  <span className="relative inline-flex" style={{ width: size, height: size }}>
    <span className="absolute inline-flex h-full w-full rounded-full" style={{ background: color, opacity: 0.3, animation: "breathe 4s ease-in-out infinite" }}/>
    <span className="relative inline-flex rounded-full h-full w-full" style={{ background: color, opacity: 0.8 }}/>
  </span>
);

// ─── MAIN ───
export default function Nexus() {
  const { weather, signals, content, goals, stocks, mode, modeOverride, setModeOverride, refresh, loading } = useNexusData();
  const { lastMessage } = useNexusSocket();

  const [time, setTime] = useState(getTimeData());
  const [showContent, setShowContent] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);
  const [isPulse, setIsPulse] = useState(true);

  const signalsRef = useRef(signals);
  signalsRef.current = signals;

  useEffect(() => {
    const timer = setInterval(() => setTime(getTimeData()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (signals.length === 0) {
      setSignalIndex(0);
      return;
    }
    setSignalIndex((i) => Math.min(i, signals.length - 1));
  }, [signals.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      const n = signalsRef.current.length;
      if (n <= 1) return;
      setSignalIndex((p) => (p + 1) % n);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!lastMessage) return;
    const msg = lastMessage;
    if (msg.type === "connected") return;

    switch (msg.type) {
      case "mode_switch":
        setModeOverride(msg.mode);
        break;
      case "mode_auto":
        setModeOverride(null);
        break;
      case "content_drop":
      case "goal_add":
      case "goal_toggle":
      case "refresh":
        refresh();
        break;
      case "view_toggle":
        setIsPulse(msg.view === "pulse");
        break;
      case "content_toggle":
        setShowContent((p) => !p);
        break;
      case "signal_next": {
        const n = signalsRef.current.length;
        if (n) setSignalIndex((i) => (i + 1) % n);
        break;
      }
      case "signal_dismiss":
        if (msg.id === "current") {
          const first = signalsRef.current[0];
          if (first) {
            fetch("/api/signals", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: first.id }),
            }).then(() => refresh());
          }
        } else if (msg.id) {
          refresh();
        }
        break;
      case "deploy_result":
      case "agent_reply":
        refresh();
        break;
      default:
        break;
    }
  }, [lastMessage, refresh, setModeOverride]);

  const mc = modeConfig[mode];

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowContent(false);
      if (e.key === "p") setIsPulse((p) => !p);
      if (e.key === "c") setShowContent((p) => !p);
      if (e.key === "1") setModeOverride("morning");
      if (e.key === "2") setModeOverride("focus");
      if (e.key === "3") setModeOverride("home");
      if (e.key === "4") setModeOverride("evening");
      if (e.key === "5") setModeOverride("weekend");
      if (e.key === "6") setModeOverride("night");
      if (e.key === "0") setModeOverride(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setModeOverride]);

  const w = weather;
  const weatherIcon = w?.icon ?? "—";
  const weatherTemp = w?.temp ?? "—";
  const weatherCond = w?.condition ?? "";
  const weatherHiLo = w && typeof w.high === "number" && typeof w.low === "number"
    ? `H:${w.high}° L:${w.low}°`
    : "";

  const sigColors: Record<string, string> = {
    lead: "#f59e0b",
    booking: "#10b981",
    product: "#06b6d4",
    finance: "#8b5cf6",
    alert: "#64748b",
    deploy: "#22c55e",
    agent: "#c084fc",
  };

  const currentSignal = signals[signalIndex];

  return (
    <div className="h-screen w-screen overflow-hidden relative flex flex-col" style={{ background: "#060608", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#fff", cursor: "none" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600;700&family=JetBrains+Mono:wght@300;400&family=Outfit:wght@100;200;300;400&display=swap');
        @keyframes breathe { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(2.5); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInSlow { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideSignal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.015; } 50% { opacity: 0.04; } }
        .fade-in { animation: fadeIn 0.6s ease both; }
        .signal-anim { animation: slideSignal 0.5s ease both; }
      `}</style>

      {loading && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 text-[10px] tracking-widest" style={{ color: "rgba(255,255,255,0.12)", fontFamily: "JetBrains Mono" }}>
          Syncing…
        </div>
      )}

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{ background: mc.bg, transition: "background 3s ease" }}/>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.008) 0%, transparent 50%)" }}/>
        <div className="absolute w-96 h-96 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${mc.color}08 0%, transparent 70%)`, top: "20%", left: "30%", animation: "float 20s ease-in-out infinite", transition: "background 3s ease" }}/>
        <div className="absolute w-64 h-64 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${mc.color}05 0%, transparent 70%)`, bottom: "30%", right: "20%", animation: "float 25s ease-in-out infinite 5s", transition: "background 3s ease" }}/>
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")" }}/>
      </div>

      {/* ─── PULSE MODE ─── */}
      {isPulse ? (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-16">
          <div className="absolute top-8 left-10 flex items-center gap-3 fade-in">
            <BreathDot color={mc.color} size={8}/>
            <span className="text-xs tracking-widest uppercase" style={{ color: `${mc.color}90`, fontFamily: "JetBrains Mono", letterSpacing: "0.2em" }}>{mc.label} Mode</span>
            {modeOverride && (
              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>override</span>
            )}
          </div>

          <div className="absolute top-8 right-10 fade-in">
            <span style={{ fontFamily: "Outfit", fontWeight: 100, fontSize: "14px", color: "rgba(255,255,255,0.12)", letterSpacing: "0.4em" }}>NEXUS</span>
          </div>

          <div className="text-center mb-6" style={{ animation: "fadeInSlow 2s ease both" }}>
            <div style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "min(18vw, 220px)", color: "#fff", lineHeight: 0.9, letterSpacing: "-0.04em", opacity: 0.95 }}>
              {time.timeStr.replace(" AM", "").replace(" PM", "")}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <span style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "min(2.5vw, 28px)", color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}>
                {time.timeStr.includes("AM") ? "AM" : "PM"}
              </span>
              <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.08)" }}/>
              <span style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "min(2.5vw, 28px)", color: "rgba(255,255,255,0.2)", letterSpacing: "0.02em" }}>
                {time.dateStr}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-12" style={{ animation: "fadeInSlow 2s ease 0.3s both" }}>
            <span style={{ fontSize: "28px" }}>{weatherIcon}</span>
            <span style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "24px", color: "rgba(255,255,255,0.4)" }}>{typeof weatherTemp === "number" ? `${weatherTemp}°` : weatherTemp}</span>
            {weatherCond && <span style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "16px", color: "rgba(255,255,255,0.15)" }}>{weatherCond}</span>}
            {weatherHiLo && (
              <>
                <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.06)" }}/>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: "12px", color: "rgba(255,255,255,0.12)" }}>{weatherHiLo}</span>
              </>
            )}
          </div>

          <div className="absolute bottom-32 left-0 right-0 flex justify-center">
            {currentSignal ? (
              <div key={signalIndex} className="flex items-center gap-3 signal-anim">
                <BreathDot color={mc.color} size={5}/>
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "DM Sans" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)" }}>{currentSignal.source}</span>
                  {" "}{currentSignal.text}
                </span>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.1)", fontFamily: "JetBrains Mono" }}>{formatSignalTime(currentSignal.time)}</span>
              </div>
            ) : (
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "DM Sans" }}>No active signals</span>
            )}
          </div>

          <div className="absolute bottom-16 left-0 right-0 flex justify-center" style={{ animation: "fadeInSlow 2s ease 0.6s both" }}>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.12)", fontFamily: "JetBrains Mono" }}>NEXT</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
                {goals.find((g) => !g.done)?.label ?? "Calendar sync coming soon"}
              </span>
            </div>
          </div>

          <div className="absolute bottom-6 right-10" style={{ animation: "fadeInSlow 3s ease 2s both" }}>
            <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.06)", fontFamily: "JetBrains Mono" }}>P: toggle view / C: content / 1–6: modes / 0: auto / ESC: close</span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex relative z-10 p-8 gap-6 fade-in">
          <div className="flex flex-col gap-6" style={{ width: "35%" }}>
            <div className="rounded-2xl p-8" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BreathDot color={mc.color} size={6}/>
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: mc.color, fontFamily: "JetBrains Mono", opacity: 0.7 }}>{mc.label}</span>
                </div>
                <span style={{ fontFamily: "Outfit", fontWeight: 100, fontSize: "11px", color: "rgba(255,255,255,0.1)", letterSpacing: "0.3em" }}>NEXUS</span>
              </div>
              <div style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "72px", color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                {time.timeStr}
              </div>
              <div className="mt-2" style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "18px", color: "rgba(255,255,255,0.2)" }}>
                {time.dateStr}
              </div>
              <div className="flex items-center gap-3 mt-4">
                <span style={{ fontSize: "20px" }}>{weatherIcon}</span>
                <span style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "18px", color: "rgba(255,255,255,0.35)" }}>
                  {typeof weatherTemp === "number" ? `${weatherTemp}°` : weatherTemp} {weatherCond}
                </span>
              </div>
            </div>

            <div className="flex-1 rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>Today&apos;s Schedule</div>
              <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.18)", fontFamily: "DM Sans" }}>
                Family calendar will appear here after Google Calendar is connected. Until then, use goals below for what&apos;s next.
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>Today&apos;s Goals</span>
                <span className="text-[10px]" style={{ color: mc.color, fontFamily: "JetBrains Mono" }}>
                  {goals.filter((g) => g.done).length}/{goals.length || 0}
                </span>
              </div>
              {goals.length === 0 ? (
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>No goals yet — add one from the phone.</div>
              ) : (
                <div className="space-y-2.5">
                  {goals.map((g) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ border: `1.5px solid ${g.done ? mc.color : "rgba(255,255,255,0.1)"}`, background: g.done ? `${mc.color}20` : "transparent" }}>
                        {g.done && <svg viewBox="0 0 24 24" fill="none" stroke={mc.color} strokeWidth="3" className="w-2.5 h-2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span className="text-sm" style={{ color: g.done ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.6)", textDecoration: g.done ? "line-through" : "none" }}>{g.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-6">
            {stocks.length > 0 && (
              <div className="rounded-2xl px-6 py-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>Markets</div>
                <div className="flex flex-wrap gap-4">
                  {stocks.slice(0, 6).map((s) => (
                    <span key={s.symbol} className="text-sm" style={{ fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.55)" }}>
                      {s.symbol}{" "}
                      <span style={{ color: s.changePercent >= 0 ? "rgba(16,185,129,0.9)" : "rgba(248,113,113,0.9)" }}>
                        {s.changePercent >= 0 ? "+" : ""}{s.changePercent.toFixed(1)}%
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="text-[10px] uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>Signals</div>
              {signals.length === 0 ? (
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>No signals — webhooks and integrations will feed this.</div>
              ) : (
                <div className="space-y-3">
                  {signals.map((sig) => (
                    <div key={sig.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.015)" }}>
                      <BreathDot color={sigColors[sig.type] || sigColors.alert} size={6}/>
                      <div className="flex-1">
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                          <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{sig.source}</span> {sig.text}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "JetBrains Mono" }}>{formatSignalTime(sig.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 rounded-2xl p-6 min-h-0 flex flex-col" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>Content Queue</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "JetBrains Mono" }}>{content.length} items</span>
              </div>
              <div className="space-y-2 overflow-hidden flex-1">
                {content.length === 0 ? (
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>Nothing queued — drop a link from the phone.</div>
                ) : (
                  content.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all"
                      style={{
                        background: item.status === "in_progress" ? "rgba(6,182,212,0.04)" : "rgba(255,255,255,0.01)",
                        border: `1px solid ${item.status === "in_progress" ? "rgba(6,182,212,0.1)" : "rgba(255,255,255,0.03)"}`,
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <span className="text-sm">{item.type === "video" ? "▶" : "🎧"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate" style={{ color: "rgba(255,255,255,0.65)" }}>{item.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>{item.source}</span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.12)", fontFamily: "JetBrains Mono" }}>{item.duration}</span>
                        </div>
                        {item.progress > 0 && (
                          <div className="w-full h-0.5 rounded-full mt-2" style={{ background: "rgba(255,255,255,0.04)" }}>
                            <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: "#06b6d4" }}/>
                          </div>
                        )}
                      </div>
                      {item.status === "in_progress" && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", fontFamily: "JetBrains Mono" }}>{item.progress}%</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2">
              {(Object.keys(modeConfig) as NexusMode[]).map((key) => {
                const cfg = modeConfig[key];
                const active = mode === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setModeOverride((prev) => (prev === key ? null : key))}
                    className="p-3 rounded-xl text-center transition-all"
                    style={{
                      background: active ? `${cfg.color}10` : "rgba(255,255,255,0.015)",
                      border: `1px solid ${active ? `${cfg.color}25` : "rgba(255,255,255,0.03)"}`,
                    }}
                  >
                    <div className="text-lg mb-1">{cfg.icon}</div>
                    <div className="text-[9px] uppercase tracking-wider" style={{ color: active ? cfg.color : "rgba(255,255,255,0.2)", fontFamily: "JetBrains Mono" }}>{cfg.label}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showContent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(6,6,8,0.95)" }}>
          <div className="w-full max-w-4xl px-8 fade-in">
            <div className="flex items-center justify-between mb-8">
              <h2 style={{ fontFamily: "Outfit", fontWeight: 200, fontSize: "36px", color: "#fff" }}>Content Queue</h2>
              <button type="button" onClick={() => setShowContent(false)} className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>ESC to close</button>
            </div>
            <div className="space-y-3">
              {content.length === 0 ? (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>Queue is empty.</p>
              ) : (
                content.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-6 p-5 rounded-2xl transition-all cursor-pointer"
                    style={{
                      background: item.status === "in_progress" ? "rgba(6,182,212,0.05)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${item.status === "in_progress" ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)"}`,
                    }}
                  >
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)", fontSize: "24px" }}>
                      {item.type === "video" ? "▶" : "🎧"}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg" style={{ color: "rgba(255,255,255,0.8)" }}>{item.title}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "JetBrains Mono" }}>{item.source}</span>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "JetBrains Mono" }}>{item.duration}</span>
                        {item.status === "in_progress" && (
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.1)", color: "#06b6d4", fontFamily: "JetBrains Mono" }}>In Progress {item.progress}%</span>
                        )}
                      </div>
                      {item.progress > 0 && (
                        <div className="w-full h-1 rounded-full mt-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full" style={{ width: `${item.progress}%`, background: "#06b6d4" }}/>
                        </div>
                      )}
                    </div>
                    <div className="text-sm" style={{ color: "rgba(255,255,255,0.2)" }}>
                      {item.status === "in_progress" ? "Resume" : "Play"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
