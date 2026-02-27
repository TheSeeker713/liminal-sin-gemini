"use client";

import { AnimatePresence, motion } from "framer-motion";

/* ─── Spiderweb crack SVG (lower-right smart-glasses fracture) ─── */
function CrackedVignette(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* full-screen radial vignette */}
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="80%" stopColor="rgba(0,0,0,0.45)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.92)" />
        </radialGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#vignette)" />

      {/* spiderweb fracture cluster — bottom-right */}
      <g
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      >
        {/* impact origin */}
        <circle cx="1580" cy="860" r="6" stroke="rgba(255,255,255,0.18)" />

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

/* ─── Grain overlay (CSS noise via repeating-conic-gradient) ─── */
function GrainOverlay(): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 opacity-[0.07] mix-blend-overlay"
      style={{
        backgroundImage:
          "repeating-conic-gradient(#777 0.0001%, transparent 0.0005%, transparent 0.0015%, #777 0.002%)",
        backgroundSize: "200px 200px",
        filter: "contrast(200%) brightness(150%)",
      }}
    />
  );
}

/* ─── Main page ─── */
export default function Home(): React.JSX.Element {
  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-950">
      {/* concrete bg tint */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-b from-neutral-900 via-stone-950 to-neutral-950"
      />

      <GrainOverlay />

      {/* ─── Centre: react-player / placeholder ─── */}
      <div className="relative z-10 flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-sm border border-white/5 bg-black shadow-2xl shadow-black/80">
        {/* ReactPlayer – uncomment & set src when a real .mp4 is ready:
          <ReactPlayer
            src="/static-loop.mp4"
            playing loop muted playsInline
            width="100%" height="100%"
            style={{ position: "absolute", inset: 0 }}
          />
        */}

        {/* fallback text shown until a real video url is set */}
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 font-mono">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs uppercase tracking-[0.35em] text-white/40"
          >
            STATIC LOOP
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1.6, ease: "easeOut" }}
            className="text-center text-2xl font-light tracking-widest text-white/70 sm:text-3xl"
          >
            VEGAS UNDERGROUND
          </motion.h1>
        </div>
      </div>

      {/* ─── Cracked smart-glasses vignette ─── */}
      <CrackedVignette />

      {/* ─── Fading monospace hints ─── */}
      <AnimatePresence>
        <motion.p
          key="hint-voice"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: 10,
            times: [0, 0.15, 0.75, 1],
            repeat: Infinity,
            repeatDelay: 4,
          }}
          className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 font-mono text-xs tracking-wider text-white/50"
        >
          Talk to Jason with your voice
        </motion.p>

        <motion.p
          key="hint-immersion"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: [0, 0.45, 0.45, 0] }}
          transition={{
            duration: 12,
            times: [0, 0.12, 0.7, 1],
            repeat: Infinity,
            repeatDelay: 6,
            delay: 3,
          }}
          className="pointer-events-none fixed bottom-8 right-8 z-50 font-mono text-[0.65rem] tracking-wider text-white/35"
        >
          Mic + webcam ON for full immersion
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
