import React from "react";

interface RandomAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PALETTES = [
  { from: "#059669", to: "#0d9488", clothes: "#10b981" }, // Emerald-Teal
  { from: "#2563eb", to: "#4f46e5", clothes: "#60a5fa" }, // Blue-Indigo
  { from: "#d97706", to: "#ea580c", clothes: "#fbbf24" }, // Amber-Orange
  { from: "#7c3aed", to: "#9333ea", clothes: "#a78bfa" }, // Violet-Purple
  { from: "#e11d48", to: "#be123c", clothes: "#fb7185" }, // Rose-Crimson
  { from: "#0891b2", to: "#0f766e", clothes: "#22d3ee" }, // Cyan-Teal
  { from: "#15803d", to: "#047857", clothes: "#4ade80" }, // Forest Green
  { from: "#c026d3", to: "#9333ea", clothes: "#f472b6" }, // Fuchsia
  { from: "#0284c7", to: "#1d4ed8", clothes: "#38bdf8" }, // Sky-Blue
  { from: "#095046", to: "#39BA87", clothes: "#F2D06B" }, // Brand BMH
  { from: "#b45309", to: "#92400e", clothes: "#fde68a" }, // Warm Gold
  { from: "#4338ca", to: "#6d28d9", clothes: "#818cf8" }, // Indigo-Violet
];

const SKIN_TONES = ["#FDDCB8", "#F6C8A4", "#E5B088", "#FDE2CD", "#D99B72"];
const HAIR_COLORS = ["#1A1A1A", "#332211", "#4A3525", "#241810", "#1C2430"];

export function RandomAvatar({
  name,
  size = 44,
  className = "",
}: RandomAvatarProps) {
  const hash = hashString(name || "Guest");
  const palette = PALETTES[hash % PALETTES.length];
  const skin = SKIN_TONES[(hash >> 2) % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[(hash >> 3) % HAIR_COLORS.length];
  const headStyle = (hash >> 4) % 6; // 0..5
  const hasGlasses = hash % 3 === 0;
  const gradId = `av-grad-${hash % 1000}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`rounded-full shrink-0 shadow-xs ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={palette.from} />
          <stop offset="1" stopColor={palette.to} />
        </linearGradient>
      </defs>

      {/* Background Circle */}
      <circle cx="20" cy="20" r="20" fill={`url(#${gradId})`} />

      {/* Body & Clothes */}
      <path
        d="M 6 40 C 6 29, 34 29, 34 40 Z"
        fill={palette.clothes}
        fillOpacity="0.95"
      />

      {/* Neck */}
      <rect x="18" y="24" width="4" height="6" rx="2" fill={skin} />

      {/* Head / Face */}
      <circle cx="20" cy="18" r="7.5" fill={skin} />

      {/* Hair / Headwear styles */}
      {headStyle === 0 && (
        // Short neat hair
        <path
          d="M 12.5 17 C 12.5 12, 27.5 12, 27.5 17 C 27.5 14, 25 11, 20 11 C 15 11, 12.5 14, 12.5 17 Z"
          fill={hairColor}
        />
      )}

      {headStyle === 1 && (
        // Hijab / Kerudung BMH
        <path
          d="M 12 18 C 12 11, 28 11, 28 18 C 28 26, 26 29, 20 29 C 14 29, 12 26, 12 18 Z"
          fill={palette.from}
          fillOpacity="0.9"
        />
      )}

      {headStyle === 2 && (
        // Side parted hair
        <path
          d="M 12.5 18 C 12.5 12, 27.5 11, 27.5 16 C 24 13, 16 13, 12.5 18 Z"
          fill={hairColor}
        />
      )}

      {headStyle === 3 && (
        // Peci / Kopiah Hitam Elegan
        <path
          d="M 13 15 C 13 11, 27 11, 27 15 L 27 16 L 13 16 Z"
          fill="#1A202C"
        />
      )}

      {headStyle === 4 && (
        // Wavy volume hair
        <path
          d="M 12 17 C 12 10, 28 10, 28 17 C 29 14, 26 9.5, 20 9.5 C 14 9.5, 11 14, 12 17 Z"
          fill={hairColor}
        />
      )}

      {headStyle === 5 && (
        // Modern top cap / hair
        <path
          d="M 13.5 16 C 14 11, 26 11, 26.5 16 C 25 12.5, 22 11.5, 20 11.5 C 18 11.5, 15 12.5, 13.5 16 Z"
          fill={hairColor}
        />
      )}

      {/* Eyes */}
      <circle cx="17.5" cy="18" r="0.9" fill="#1A202C" />
      <circle cx="22.5" cy="18" r="0.9" fill="#1A202C" />

      {/* Glasses (if applicable) */}
      {hasGlasses && (
        <g stroke="#1A202C" strokeWidth="0.8" fill="none">
          <circle cx="17.5" cy="18" r="2.2" />
          <circle cx="22.5" cy="18" r="2.2" />
          <line x1="19.7" y1="18" x2="20.3" y2="18" />
        </g>
      )}

      {/* Cheerful Smile */}
      <path
        d="M 18 21.5 Q 20 23.5 22 21.5"
        stroke="#8B4513"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
