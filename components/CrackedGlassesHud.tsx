"use client";

import { motion } from "framer-motion";
import { Flashlight, Gauge, AudioLines, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";

/* ─── Types ─── */
export interface CrackedGlassesHudProps {
  /** Current visual filter alias ("night-vision" | "thermal" | "none" etc.) */
  activeFilter: string;
  /** 0–100  – NPC trust towards the player */
  trustLevel: number;
  /** 0–100  – player fear / stress index */
  fearIndex: number;
}

/* ─── Inventory ghost-icon definitions ─── */
interface GhostIcon {
  Icon: ComponentType<LucideProps>;
  label: string;
  /** base flicker period (seconds) */
  period: number;
  /** phase offset so icons don't sync */
  delay: number;
}

const GHOST_ICONS: GhostIcon[] = [
  { Icon: Flashlight, label: "Flashlight", period: 3.2, delay: 0 },
  { Icon: Gauge, label: "Multimeter", period: 4.0, delay: 1.1 },
  { Icon: AudioLines, label: "Voicebox", period: 3.6, delay: 0.6 },
];

/* ─── Spiderweb crack SVG (lower-right smart-glasses fracture) ─── */
function SpiderwebCrack(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* radial vignette */}
      <defs>
        <radialGradient id="hud-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="75%" stopColor="rgba(0,0,0,0.35)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.88)" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#hud-vignette)" />

      {/* spiderweb fracture — bottom-right quadrant */}
      <g
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      >
        {/* impact origin */}
        <circle cx="1580" cy="860" r="6" stroke="rgba(255,255,255,0.2)" />

        {/* primary radials */}
        <line x1="1580" y1="860" x2="1720" y2="780" />
        <line x1="1580" y1="860" x2="1750" y2="870" />
        <line x1="1580" y1="860" x2="1700" y2="960" />
        <line x1="1580" y1="860" x2="1620" y2="1000" />
        <line x1="1580" y1="860" x2="1480" y2="980" />
        <line x1="1580" y1="860" x2="1440" y2="890" />
        <line x1="1580" y1="860" x2="1460" y2="770" />
        <line x1="1580" y1="860" x2="1530" y2="740" />

        {/* secondary forks */}
        <line x1="1650" y1="820" x2="1690" y2="750" />
        <line x1="1650" y1="820" x2="1710" y2="830" />
        <line x1="1660" y1="880" x2="1730" y2="910" />
        <line x1="1640" y1="930" x2="1680" y2="990" />
        <line x1="1530" y1="930" x2="1500" y2="1010" />
        <line x1="1510" y1="880" x2="1430" y2="860" />
        <line x1="1520" y1="800" x2="1470" y2="740" />

        {/* concentric arcs (webbing) */}
        <path d="M1630,810 Q1660,840 1640,870" />
        <path d="M1640,900 Q1620,940 1560,940" />
        <path d="M1510,850 Q1500,820 1530,790" />
        <path d="M1690,800 Q1720,850 1700,910" />
        <path d="M1550,960 Q1600,980 1640,960" />

        {/* micro-shatter fragments near impact */}
        <line x1="1575" y1="850" x2="1560" y2="835" strokeWidth="0.8" />
        <line x1="1590" y1="855" x2="1610" y2="840" strokeWidth="0.8" />
        <line x1="1585" y1="870" x2="1600" y2="885" strokeWidth="0.8" />
        <line x1="1570" y1="865" x2="1555" y2="880" strokeWidth="0.8" />
      </g>
    </svg>
  );
}

/* ─── HUD stat readout (top-left) ─── */
function StatReadout({
  activeFilter,
  trustLevel,
  fearIndex,
}: Pick<
  CrackedGlassesHudProps,
  "activeFilter" | "trustLevel" | "fearIndex"
>): React.JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 1.8 }}
      className="pointer-events-none absolute left-6 top-6 z-10 flex flex-col gap-1 font-mono text-[0.6rem] uppercase tracking-widest text-white/25"
    >
      <span>
        FILTER{" "}
        <span className="text-white/40">{activeFilter || "none"}</span>
      </span>
      <span>
        TRUST{" "}
        <span
          className={
            trustLevel > 60
              ? "text-emerald-500/50"
              : trustLevel > 30
                ? "text-amber-400/50"
                : "text-red-500/50"
          }
        >
          {trustLevel}
        </span>
      </span>
      <span>
        FEAR{" "}
        <span
          className={
            fearIndex > 70
              ? "text-red-500/60"
              : fearIndex > 40
                ? "text-amber-400/50"
                : "text-white/40"
          }
        >
          {fearIndex}
        </span>
      </span>
    </motion.div>
  );
}

/* ─── Flickering inventory ghost icons (bottom-left) ─── */
function GhostInventory(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 z-10 flex gap-5">
      {GHOST_ICONS.map(({ Icon, label, period, delay }) => (
        <motion.div
          key={label}
          aria-label={label}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0.08, 0.3, 0.05, 0.2, 0] }}
          transition={{
            duration: period,
            repeat: Infinity,
            repeatDelay: period * 0.4,
            delay,
            ease: "easeInOut",
          }}
          className="flex flex-col items-center gap-1"
        >
          <Icon
            size={20}
            strokeWidth={1.2}
            className="text-white/30 drop-shadow-[0_0_4px_rgba(255,255,255,0.08)]"
          />
          <span className="font-mono text-[0.5rem] uppercase tracking-wider text-white/15">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Fear pulse ring (centre, scales with fearIndex) ─── */
function FearPulse({
  fearIndex,
}: Pick<CrackedGlassesHudProps, "fearIndex">): React.JSX.Element | null {
  if (fearIndex < 20) return null;

  const intensity = Math.min(fearIndex / 100, 1);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{
        scale: [0.92, 1.0, 0.92],
        opacity: [0, intensity * 0.12, 0],
      }}
      transition={{
        duration: 2.4 - intensity * 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="pointer-events-none absolute inset-0 z-[5] rounded-full border border-red-500/20"
      style={{
        boxShadow: `inset 0 0 ${60 + intensity * 80}px rgba(220,38,38,${intensity * 0.08})`,
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Main HUD component
   ═══════════════════════════════════════════════════════════════════ */
export default function CrackedGlassesHud({
  activeFilter,
  trustLevel,
  fearIndex,
}: CrackedGlassesHudProps): React.JSX.Element {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {/* Spiderweb crack overlay */}
      <SpiderwebCrack />

      {/* HUD readouts */}
      <StatReadout
        activeFilter={activeFilter}
        trustLevel={trustLevel}
        fearIndex={fearIndex}
      />

      {/* Flickering ghost inventory */}
      <GhostInventory />

      {/* Fear pulse (subtle red vignette ring) */}
      <FearPulse fearIndex={fearIndex} />
    </div>
  );
}
