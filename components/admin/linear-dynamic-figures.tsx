"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

export function LinearDynamicFigures() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <aside
      className={[
        "w-full print:hidden",
        // Mobile: stacked with gap
        "space-y-4",
        // Desktop: fill parent height, distribute panels evenly
        "lg:space-y-0 lg:flex lg:flex-col lg:gap-3 lg:h-full lg:min-h-0",
      ].join(" ")}
      aria-label="Panel visualisasi teknis presensi"
    >
      {/* FIG 0.1 // GERBANG PEMINDAI */}
      <section
        className={[
          "bg-[#0A3A30] border border-[#3FBF8F]/15 rounded-[20px] lg:rounded-[18px]",
          "p-4 lg:p-3 xl:p-4",
          "shadow-xs text-left relative overflow-hidden",
          // Desktop: equal height distribution
          "lg:flex-1 lg:min-h-0 lg:flex lg:flex-col",
        ].join(" ")}
        aria-labelledby="fig-01-title"
      >
        <div className="flex items-center justify-between mb-1 lg:mb-0.5 shrink-0">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-[#3FBF8F]">
            FIG 0.1 // GERBANG PEMINDAI
          </span>
          <span className="text-[9px] font-mono text-[#EEFBF5]/50" aria-hidden="true">
            ISOMETRIC 30°
          </span>
        </div>

        <div
          className="w-full flex-1 min-h-0 flex items-center justify-center select-none"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 320 180"
            className="w-full h-full max-w-[300px]"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="slabGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3FBF8F" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#134B40" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <path d="M 60 140 L 160 82 L 260 140 L 160 175 Z" stroke="rgba(63,191,143,0.12)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Layer 0 — Base */}
            <g>
              <polygon points="160,120 226,145 160,165 94,145" fill="url(#slabGlow)" stroke="#3FBF8F" strokeWidth="1.2" strokeOpacity="0.35" />
              <polygon points="94,145 160,165 160,172 94,152" fill="#134B40" fillOpacity="0.3" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.3" />
              <polygon points="160,165 226,145 226,152 160,172" fill="#134B40" fillOpacity="0.45" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.3" />
            </g>

            {/* Projection lines */}
            <motion.g animate={shouldReduceMotion ? undefined : { opacity: [0.35, 0.75, 0.35] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <line x1="94" y1="145" x2="105" y2="105" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
              <line x1="226" y1="145" x2="215" y2="105" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
              <line x1="160" y1="165" x2="160" y2="125" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
              <line x1="160" y1="120" x2="160" y2="82" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.4" />
            </motion.g>

            {/* Layer 1 — Middle */}
            <motion.g animate={shouldReduceMotion ? undefined : { y: [0, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <polygon points="160,98 218,120 160,138 102,120" fill="url(#slabGlow)" stroke="#3FBF8F" strokeWidth="1.2" strokeOpacity="0.5" />
              <polygon points="102,120 160,138 160,144 102,126" fill="#134B40" fillOpacity="0.35" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
              <polygon points="160,138 218,120 218,126 160,144" fill="#134B40" fillOpacity="0.5" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
            </motion.g>

            {/* Layer 2 + Arch */}
            <motion.g animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
              <polygon points="160,74 210,93 160,109 110,93" fill="#134B40" fillOpacity="0.5" stroke="#3FBF8F" strokeWidth="1.4" strokeOpacity="0.8" />
              <polygon points="110,93 160,109 160,114 110,98" fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.5" />
              <polygon points="160,109 210,93 210,98 160,114" fill="#134B40" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.5" />
              <path d="M 136 86 L 136 48 C 136 34, 150 25, 160 18 C 170 25, 184 34, 184 48 L 184 86 L 174 82 L 174 50 C 174 40, 166 34, 160 30 C 154 34, 146 40, 146 50 L 146 82 Z" fill="#134B40" fillOpacity="0.75" stroke="#3FBF8F" strokeWidth="1.3" />
              <line x1="160" y1="18" x2="160" y2="74" stroke="rgba(63,191,143,0.25)" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="160" cy="18" r="2" fill="#F2D06B" />
            </motion.g>
          </svg>
        </div>

        <div className="shrink-0 mt-1 lg:mt-0.5">
          <h3 id="fig-01-title" className="text-[13px] lg:text-xs font-semibold text-white tracking-tight">
            Gerbang Presensi Digital
          </h3>
          <p className="text-[11px] lg:text-[10px] text-[#EEFBF5]/70 leading-snug mt-0.5 line-clamp-2">
            Siluet gerbang arsitektural dan tumpukan layer isometrik merepresentasikan alur satu pintu masuk presensi.
          </p>
        </div>
      </section>

      {/* FIG 0.2 // TITIK TAMU */}
      <section
        className={[
          "bg-[#0A3A30] border border-[#3FBF8F]/15 rounded-[20px] lg:rounded-[18px]",
          "p-4 lg:p-3 xl:p-4",
          "shadow-xs text-left relative overflow-hidden",
          "lg:flex-1 lg:min-h-0 lg:flex lg:flex-col",
        ].join(" ")}
        aria-labelledby="fig-02-title"
      >
        <div className="flex items-center justify-between mb-1 lg:mb-0.5 shrink-0">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-[#3FBF8F]">
            FIG 0.2 // TITIK TAMU
          </span>
          <span className="text-[9px] font-mono text-[#EEFBF5]/50" aria-hidden="true">
            CLUSTER NODES
          </span>
        </div>

        <div
          className="w-full flex-1 min-h-0 flex items-center justify-center select-none"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 320 180"
            className="w-full h-full max-w-[300px]"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 60 120 L 160 68 L 260 120 L 160 172 Z" stroke="rgba(63,191,143,0.12)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Cube 1 — Left */}
            <g>
              <polygon points="108,68 130,80 108,92 86,80" fill="#134B40" fillOpacity="0.45" stroke="#3FBF8F" strokeWidth="1.2" strokeOpacity="0.6" />
              <polygon points="86,80 108,92 108,126 86,114" fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
              <polygon points="108,92 130,80 130,114 108,126" fill="#134B40" fillOpacity="0.6" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
            </g>

            {/* Cube 2 — Center tall */}
            <motion.g animate={shouldReduceMotion ? undefined : { y: [0, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
              <polygon points="160,34 186,49 160,64 134,49" fill="#134B40" fillOpacity="0.6" stroke="#3FBF8F" strokeWidth="1.3" strokeOpacity="0.8" />
              <polygon points="134,49 160,64 160,104 134,89" fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.4" />
              <polygon points="160,64 186,49 186,89 160,104" fill="#134B40" fillOpacity="0.7" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.4" />
              <circle cx="160" cy="49" r="2.5" fill="#3FBF8F" />
              <motion.circle cx="160" cy="49" r="2.5" fill="none" stroke="#3FBF8F" strokeWidth="1" animate={shouldReduceMotion ? undefined : { r: [2.5, 9, 2.5], opacity: [0.8, 0, 0.8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />
              <circle cx="160" cy="49" r="1.2" fill="#F2D06B" />
            </motion.g>

            {/* Cube 3 — Right */}
            <g>
              <polygon points="212,68 234,80 212,92 190,80" fill="#134B40" fillOpacity="0.4" stroke="#3FBF8F" strokeWidth="1.2" strokeOpacity="0.6" />
              <polygon points="190,80 212,92 212,126 190,114" fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
              <polygon points="212,92 234,80 234,114 212,126" fill="#134B40" fillOpacity="0.5" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
            </g>

            {/* Cube 4 — Front small */}
            <motion.g animate={shouldReduceMotion ? undefined : { y: [0, 2, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
              <polygon points="160,112 180,123 160,134 140,123" fill="#134B40" fillOpacity="0.5" stroke="#3FBF8F" strokeWidth="1.2" strokeOpacity="0.7" />
              <polygon points="140,123 160,134 160,154 140,143" fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
              <polygon points="160,134 180,123 180,143 160,154" fill="#134B40" fillOpacity="0.6" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.35" />
              <circle cx="160" cy="123" r="2" fill="#3FBF8F" />
              <motion.circle cx="160" cy="123" r="2" fill="none" stroke="#3FBF8F" strokeWidth="1" animate={shouldReduceMotion ? undefined : { r: [2, 7, 2], opacity: [0.7, 0, 0.7] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
            </motion.g>

            {/* Projection lines */}
            <line x1="108" y1="68" x2="160" y2="49" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.25" />
            <line x1="212" y1="68" x2="160" y2="49" stroke="#3FBF8F" strokeWidth="1" strokeDasharray="2 3" strokeOpacity="0.25" />
          </svg>
        </div>

        <div className="shrink-0 mt-1 lg:mt-0.5">
          <h3 id="fig-02-title" className="text-[13px] lg:text-xs font-semibold text-white tracking-tight">
            Klaster Kehadiran Daerah
          </h3>
          <p className="text-[11px] lg:text-[10px] text-[#EEFBF5]/70 leading-snug mt-0.5 line-clamp-2">
            Kubus isometrik bertingkat melambangkan delegasi perwakilan daerah yang terdata terdistribusi.
          </p>
        </div>
      </section>

      {/* FIG 0.3 // ALIRAN KE LAYAR */}
      <section
        className={[
          "bg-[#0A3A30] border border-[#3FBF8F]/15 rounded-[20px] lg:rounded-[18px]",
          "p-4 lg:p-3 xl:p-4",
          "shadow-xs text-left relative overflow-hidden",
          "lg:flex-1 lg:min-h-0 lg:flex lg:flex-col",
        ].join(" ")}
        aria-labelledby="fig-03-title"
      >
        <div className="flex items-center justify-between mb-1 lg:mb-0.5 shrink-0">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-[#3FBF8F]">
            FIG 0.3 // ALIRAN KE LAYAR
          </span>
          <span className="text-[9px] font-mono text-[#EEFBF5]/50" aria-hidden="true">
            VELOCITY FINS
          </span>
        </div>

        <div
          className="w-full flex-1 min-h-0 flex items-center justify-center select-none relative overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 320 180"
            className="w-full h-full max-w-[300px]"
            preserveAspectRatio="xMidYMid meet"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="finSweep" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3FBF8F" stopOpacity="0" />
                <stop offset="50%" stopColor="#3FBF8F" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3FBF8F" stopOpacity="0" />
              </linearGradient>
            </defs>

            <path d="M 50 145 L 270 145" stroke="rgba(63,191,143,0.12)" strokeWidth="1" strokeDasharray="3 3" />

            {[
              { x: 70, y: 142, h: 16, w: 7 },
              { x: 92, y: 140, h: 26, w: 7 },
              { x: 114, y: 138, h: 38, w: 7 },
              { x: 136, y: 136, h: 54, w: 7 },
              { x: 158, y: 134, h: 72, w: 7 },
              { x: 180, y: 132, h: 90, w: 7 },
              { x: 202, y: 134, h: 72, w: 7 },
              { x: 224, y: 136, h: 54, w: 7 },
              { x: 246, y: 138, h: 36, w: 7 },
            ].map((fin, i) => {
              const topY = fin.y - fin.h;
              return (
                <g key={`fin-${i}`}>
                  <rect x={fin.x} y={topY} width={fin.w} height={fin.h} fill="#134B40" fillOpacity={0.35 + (fin.h / 90) * 0.35} stroke="#3FBF8F" strokeWidth="1.1" strokeOpacity={0.4 + (fin.h / 90) * 0.4} rx="1" />
                  <polygon points={`${fin.x},${topY} ${fin.x + 4},${topY - 3} ${fin.x + fin.w + 4},${topY - 3} ${fin.x + fin.w},${topY}`} fill="#3FBF8F" fillOpacity="0.4" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.5" />
                  <polygon points={`${fin.x + fin.w},${topY} ${fin.x + fin.w + 4},${topY - 3} ${fin.x + fin.w + 4},${fin.y - 3} ${fin.x + fin.w},${fin.y}`} fill="#0A3A30" stroke="#3FBF8F" strokeWidth="1" strokeOpacity="0.3" />
                </g>
              );
            })}

            <motion.rect x="50" y="30" width="80" height="130" fill="url(#finSweep)" animate={shouldReduceMotion ? undefined : { x: [50, 220, 50], opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} style={{ pointerEvents: "none" }} />
            <circle cx="184" cy="41" r="1.5" fill="#F2D06B" />
          </svg>
        </div>

        <div className="shrink-0 mt-1 lg:mt-0.5">
          <h3 id="fig-03-title" className="text-[13px] lg:text-xs font-semibold text-white tracking-tight">
            Aliran Menuju Layar Panggung
          </h3>
          <p className="text-[11px] lg:text-[10px] text-[#EEFBF5]/70 leading-snug mt-0.5 line-clamp-2">
            Sirip vertikal berirama menggambarkan aliran data presensi ke videotron panggung.
          </p>
        </div>
      </section>
    </aside>
  );
}
