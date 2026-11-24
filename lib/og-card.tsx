import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { EVENT_INFO, EVENT_THEME } from "@/content/rakernas";
import { splitEventTitle } from "@/lib/event-title";

export const OG_SIZE = { width: 1200, height: 630 } as const;

// Aset lokal tidak bergantung pada request: dibaca sekali di module scope.
const logoBase64 = await readFile(join(process.cwd(), "public", "logo-rakernas-nav.png"), "base64");
const logoSrc = `data:image/png;base64,${logoBase64}`;
const fontDir = join(process.cwd(), "assets", "fonts");
const [poppinsRegular, poppinsSemiBold] = await Promise.all(
  ["Poppins-Regular.ttf", "Poppins-SemiBold.ttf"].map((file) => readFile(join(fontDir, file)))
);

// Warna token beranda (app/globals.css) dalam bentuk hex — satori tidak mengenal var()/color-mix().
const COLOR = {
  primary: "#095046", // --primary / --brand-green-deep
  secondary: "#EBF8F3", // --secondary
  inkMuted: "#4E7A72", // --ink-muted
  green100: "#D3F0E4", // --green-100
  gold100: "#FFEDCD", // --gold-100
  goldSoft: "#FED38A", // --brand-gold-soft
  gold: "#FEB738", // --brand-gold
};

/**
 * Kartu gambar Open Graph bergaya hero beranda: logo, judul dua baris dengan stabilo emas
 * pada tahun, dan tema acara. Tidak memuat tanggal maupun teks lokasi/tempat.
 */
export function renderOgCard(options: { badge?: string } = {}) {
  const titleParts = splitEventTitle(EVENT_INFO.title);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 96px",
          background: `linear-gradient(180deg, #FFFFFF 0%, ${COLOR.secondary} 100%)`,
          color: COLOR.primary,
          fontFamily: "Poppins",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* Cincin dekoratif seperti .hero::before / ::after */}
        <div
          style={{
            position: "absolute",
            top: -250,
            left: -230,
            width: 460,
            height: 460,
            borderRadius: 999,
            border: `72px solid ${COLOR.green100}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -220,
            bottom: -300,
            width: 460,
            height: 460,
            borderRadius: 999,
            border: `62px solid ${COLOR.gold100}`,
          }}
        />

        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Logo Rakernas (lambang + nama acara); rasio 600:223 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} width={300} height={111.5} alt="" />
          {options.badge ? (
            <div
              style={{
                display: "flex",
                marginLeft: 28,
                padding: "12px 26px",
                borderRadius: 999,
                background: COLOR.gold,
                color: COLOR.primary,
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {options.badge}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 32,
            fontSize: 76,
            fontWeight: 600,
            lineHeight: 1.14,
            letterSpacing: "-0.035em",
          }}
        >
          {titleParts ? (
            [
              <div key="lead" style={{ display: "flex" }}>{titleParts.lead}</div>,
              <div key="last" style={{ display: "flex" }}>
                {titleParts.word}
                <div style={{ position: "relative", display: "flex", marginLeft: 22 }}>
                  {/* Stabilo emas di bawah tahun seperti .year::after */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 12,
                      height: 18,
                      borderRadius: 4,
                      background: COLOR.goldSoft,
                    }}
                  />
                  {titleParts.year}
                </div>
              </div>,
            ]
          ) : (
            <div style={{ display: "flex" }}>{EVENT_INFO.title}</div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 760,
            marginTop: 28,
            fontSize: 30,
            fontWeight: 400,
            lineHeight: 1.5,
            color: COLOR.inkMuted,
          }}
        >
          {EVENT_THEME}
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Poppins", data: poppinsRegular, weight: 400, style: "normal" },
        { name: "Poppins", data: poppinsSemiBold, weight: 600, style: "normal" },
      ],
    }
  );
}
