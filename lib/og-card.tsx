import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENT_INFO, EVENT_THEME } from "@/content/rakernas";

export const OG_SIZE = { width: 1200, height: 630 } as const;

// Aset lokal tidak bergantung pada request: dibaca sekali di module scope.
const logoBase64 = await readFile(join(process.cwd(), "public", "logo.png"), "base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;

/**
 * Kartu gambar Open Graph: logo, judul, dan tema acara saja.
 * Tidak memuat tanggal maupun teks lokasi/tempat.
 */
export function renderOgCard(options: { badge?: string } = {}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "64px 88px",
          background: "linear-gradient(135deg, #0A3A30 0%, #095046 100%)",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 32,
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={104} height={98} alt="" />
          </div>
          {options.badge ? (
            <div
              style={{
                display: "flex",
                marginLeft: 32,
                padding: "12px 28px",
                borderRadius: 999,
                background: "#FEB738",
                color: "#0A3A30",
                fontSize: 30,
              }}
            >
              {options.badge}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 52,
            fontSize: 78,
            lineHeight: 1.1,
            color: "#F2D06B",
          }}
        >
          {EVENT_INFO.title}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 30,
            fontSize: 38,
            lineHeight: 1.35,
            color: "#E6F4EF",
          }}
        >
          {`Tema: ${EVENT_THEME}`}
        </div>
      </div>
    ),
    { ...OG_SIZE }
  );
}
