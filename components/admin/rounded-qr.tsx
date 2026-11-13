"use client";

import React, { useMemo } from "react";
import QRCode from "qrcode";

export interface RoundedQrProps {
  value: string;
  level?: "M" | "Q";
  margin?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
}

export const OFFICIAL_ABSEN_URL =
  "https://absensi-visual-bmh.vercel.app/absen";

export function resolveQrTargetUrl(siteUrl?: string): string {
  if (!siteUrl) return OFFICIAL_ABSEN_URL;
  const trimmed = siteUrl.trim();
  // Cegah URL localhost / 127.0.0.1 agar scan kamera HP selalu membuka URL publik resmi
  if (trimmed.includes("localhost") || trimmed.includes("127.0.0.1")) {
    return OFFICIAL_ABSEN_URL;
  }
  return `${trimmed.replace(/\/$/, "")}/absen`;
}

export function isFinderPattern(r: number, c: number, size: number): boolean {
  return (
    (r < 7 && c < 7) || // Top-Left
    (r < 7 && c >= size - 7) || // Top-Right
    (r >= size - 7 && c < 7) // Bottom-Left
  );
}

export interface FinderPatternDef {
  r: number;
  c: number;
}

export function getFinderPatterns(size: number): FinderPatternDef[] {
  return [
    { r: 0, c: 0 },
    { r: 0, c: size - 7 },
    { r: size - 7, c: 0 },
  ];
}

export function RoundedQr({
  value,
  level = "M",
  margin = 4,
  color = "#134B40",
  bgColor = "#FFFFFF",
  className,
  svgRef,
}: RoundedQrProps) {
  const qr = useMemo(() => {
    try {
      return QRCode.create(value, {
        errorCorrectionLevel: level,
      });
    } catch (err) {
      console.error("Gagal membuat matriks QR Code:", err);
      return null;
    }
  }, [value, level]);

  if (!qr) {
    return (
      <div className="w-64 h-64 flex items-center justify-center bg-surface rounded-2xl text-ink-muted text-xs">
        Gagal memuat QR Code
      </div>
    );
  }

  const matrixSize = qr.modules.size;
  const totalSize = matrixSize + margin * 2;
  const finderPatterns = getFinderPatterns(matrixSize);

  // Modul reguler gelap (di luar 3 finder pattern)
  const regularModules: { r: number; c: number }[] = [];
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (Boolean(qr.modules.get(r, c)) && !isFinderPattern(r, c, matrixSize)) {
        regularModules.push({ r, c });
      }
    }
  }

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      className={className}
      shapeRendering="geometricPrecision"
      aria-label="QR Code Presensi BMH"
      role="img"
    >
      {/* Background & Quiet Zone */}
      <rect width={totalSize} height={totalSize} fill={bgColor} />

      {/* Regular Modules with 35% rounded corners (30–40% per spesifikasi) */}
      {regularModules.map(({ r, c }) => (
        <rect
          key={`m-${r}-${c}`}
          x={c + margin}
          y={r + margin}
          width={1}
          height={1}
          rx={0.35}
          ry={0.35}
          fill={color}
        />
      ))}

      {/* 3 Finder Patterns dengan Outer Ring membulat halus & Titik Tengah membulat penuh */}
      {finderPatterns.map(({ r, c }, idx) => {
        const x0 = c + margin;
        const y0 = r + margin;
        return (
          <g key={`finder-${idx}`}>
            {/* Outer Frame 7x7 modules - membulat lebih halus (rx=1.8) */}
            <rect
              x={x0}
              y={y0}
              width={7}
              height={7}
              rx={1.8}
              ry={1.8}
              fill={color}
            />
            {/* Inner White Gap 5x5 modules (rx=1.0 konsentris) */}
            <rect
              x={x0 + 1}
              y={y0 + 1}
              width={5}
              height={5}
              rx={1.0}
              ry={1.0}
              fill={bgColor}
            />
            {/* Inner Center 3x3 modules - membulat penuh seperti titik (lingkaran r=1.5) */}
            <circle cx={x0 + 3.5} cy={y0 + 3.5} r={1.5} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
