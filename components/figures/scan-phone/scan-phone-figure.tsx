"use client";

import { useEffect, useRef } from "react";
import { Plate } from "@/components/iso/draw";
import { follow, useLoop, useReadout, useStillness } from "@/components/iso/live";
import { NO_OPEN_SESSION, fillOf, fitText, openLabel, scanReadout, totalHadir, type LiveSnapshot } from "@/lib/live-attendance-model";
import { ART_BACK, ART_FRONT, ART_PHONE, BEAM, GLASS, HEIGHT, QR_BOX, SCREEN, WIDTH, qrModules } from "./geometry";
import "./scan-phone.css";

const SCAN_PERIOD = 3.6; // detik per sapuan saat diam
const FLASH_SECONDS = 1.8;

// Jendela bidik di layar HP (koordinat lokal x, z)
const VF = { x0: -17, x1: 17, z0: 96, z1: 130 };
const VF_QR = qrModules({ x0: VF.x0 + 5, x1: VF.x1 - 5, z1: VF.z1 - 5 });
// Baris hitungan per sesi yang dibuka (maks. 3), koordinat lokal
const ROW = { label: GLASS.x0 + 6, bar0: -9, bar1: 10, value: GLASS.x1 - 6, z: [68.5, 63, 57.5], h: 2 };

export interface ScanPhoneProps extends LiveSnapshot {
  pulse: number;
}

export function ScanPhoneFigure({ sessions, total, latest, pulse }: ScanPhoneProps) {
  const hadir = totalHadir(sessions);
  const { anchor, say } = useReadout<SVGSVGElement>();
  const still = useStillness();
  const cardScanRef = useRef<SVGPathElement>(null);
  const screenScanRef = useRef<SVGPathElement>(null);
  const raysRef = useRef<SVGGElement>(null);
  const checkRef = useRef<SVGGElement>(null);
  const countRef = useRef<SVGTextElement>(null);
  const motion = useRef({ t: 0, flash: 0, shown: hadir, target: hadir });

  // Data baru → target animasi
  useEffect(() => {
    motion.current.target = hadir;
    say(scanReadout({ sessions, total }));
  }, [hadir, sessions, total, say]);

  const kick = useLoop((dt, calm) => {
    const m = motion.current;
    m.t = calm ? 0.5 : (m.t + dt / SCAN_PERIOD) % 1;
    m.flash = calm ? 0 : Math.max(0, m.flash - dt / FLASH_SECONDS);
    m.shown = follow(m.shown, m.target, dt, 0.35, calm);

    // Sapuan pindai: naik-turun halus (cosinus), lebih cepat & terang saat ada absen baru
    const s = 0.5 - 0.5 * Math.cos(m.t * Math.PI * 2);
    const zCard = QR_BOX.z1 - s * (QR_BOX.z1 - QR_BOX.z0);
    const zScreen = VF.z1 - s * (VF.z1 - VF.z0);
    cardScanRef.current?.setAttribute("transform", `translate(0 ${(-zCard).toFixed(2)})`);
    screenScanRef.current?.setAttribute("transform", `translate(0 ${(-zScreen).toFixed(2)})`);
    const glow = 0.28 + 0.72 * m.flash;
    raysRef.current?.setAttribute("opacity", glow.toFixed(3));
    checkRef.current?.setAttribute("opacity", Math.min(1, m.flash * 1.6).toFixed(3));
    const countNode = countRef.current?.firstChild;
    if (countNode) countNode.nodeValue = String(Math.round(m.shown));
    return !calm;
  }, !still);

  // Setiap absen baru: kilat sinar + tanda centang
  useEffect(() => {
    if (pulse === 0) return;
    motion.current.flash = 1;
    motion.current.t = 0;
    kick();
  }, [pulse, kick]);

  const last = latest[0];
  const none = sessions.length === 0;
  const label = openLabel(sessions);
  const sub = none ? NO_OPEN_SESSION : sessions.length === 1 ? `dari ${total} peserta hadir` : `absen · ${sessions.length} sesi dibuka`;
  const caption = none
    ? "Belum ada sesi yang dibuka panitia. Layar HP mulai menghitung begitu sesi dibuka."
    : `${sessions.map((s) => `${s.label}: ${s.hadir}/${total}`).join(" · ")}. Angka di layar HP naik setiap ada scan baru.`;

  return (
    <Plate
      fig="Fig 1"
      title="Pemindai"
      readout={scanReadout({ sessions, total })}
      caption={caption}
    >
      <div className="iso-stage sp">
        <svg ref={anchor} className="iso-svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`HP pada dudukan memindai kartu QR. ${scanReadout({ sessions, total })}.`}>
          <g dangerouslySetInnerHTML={{ __html: ART_BACK }} />

          {/* Garis pindai di kartu QR + berkas sinar dari kamera belakang */}
          <g transform={BEAM.cardPlane}>
            <path ref={cardScanRef} className="sp-scan" d={BEAM.scanLine} />
          </g>
          <g ref={raysRef} opacity={0.28}>
            <path className="iso-line" data-tone="lit" d={BEAM.rays} />
            <path className="iso-line" data-tone="lit" d={BEAM.frame} />
          </g>

          <g dangerouslySetInnerHTML={{ __html: ART_PHONE }} />

          {/* Layar HP: digambar di bidang kaca, diklip ke jendela */}
          <g clipPath={`url(#${SCREEN.id})`}>
            <g transform={SCREEN.backPlane}>
              <path className="sp-glass" d={SCREEN.shape} />
              {/* Status bar */}
              <circle className="sp-live" cx={GLASS.x0 + 5} cy={-(GLASS.z1 - 5.2)} r={1.1} />
              <text className="sp-ink-dim" x={GLASS.x0 + 8} y={-(GLASS.z1 - 6.4)} fontSize={3.1}>
                {fitText(sessions.length > 1 ? `${sessions.length} sesi dibuka` : label, 17)}
              </text>
              {/* Jendela bidik + pratinjau QR */}
              <path className="sp-vf-fill" d={`M${VF.x0} ${-VF.z1}H${VF.x1}V${-VF.z0}H${VF.x0}Z`} />
              <path
                className="sp-vf"
                d={[
                  `M${VF.x0} ${-VF.z1 + 6}V${-VF.z1}H${VF.x0 + 6}`,
                  `M${VF.x1 - 6} ${-VF.z1}H${VF.x1}V${-VF.z1 + 6}`,
                  `M${VF.x1} ${-VF.z0 - 6}V${-VF.z0}H${VF.x1 - 6}`,
                  `M${VF.x0 + 6} ${-VF.z0}H${VF.x0}V${-VF.z0 - 6}`,
                ].join("")}
              />
              <path className="sp-vf-qr" d={VF_QR} />
              <path ref={screenScanRef} className="sp-scan-screen" d={`M${VF.x0 + 1} 0H${VF.x1 - 1}`} />
              {/* Jumlah hadir */}
              <text ref={countRef} className="sp-ink" x={0} y={-80} fontSize={17} textAnchor="middle">
                {hadir}
              </text>
              <text className="sp-ink-dim" x={0} y={-74} fontSize={3.2} textAnchor="middle">
                {sub}
              </text>
              {/* Hitungan per sesi yang dibuka */}
              {sessions.slice(0, 3).map((session, i) => {
                const z = ROW.z[i];
                return (
                  <g key={session.id}>
                    <text className="sp-ink-dim" x={ROW.label} y={-(z - 0.9)} fontSize={2.7}>
                      {session.short}
                    </text>
                    <rect className="sp-track" x={ROW.bar0} y={-(z + ROW.h / 2)} width={ROW.bar1 - ROW.bar0} height={ROW.h} rx={ROW.h / 2} />
                    <rect className="sp-fill" x={ROW.bar0} y={-(z + ROW.h / 2)} width={(ROW.bar1 - ROW.bar0) * fillOf(session.hadir, total)} height={ROW.h} rx={ROW.h / 2} />
                    <text className="sp-ink-dim" x={ROW.value} y={-(z - 0.9)} fontSize={2.6} textAnchor="end">
                      {`${session.hadir}/${total}`}
                    </text>
                  </g>
                );
              })}
              {/* Peserta terakhir */}
              <path className="sp-rule" d={`M${GLASS.x0 + 6} ${-52}H${GLASS.x1 - 6}`} />
              <text className="sp-ink-dim" x={GLASS.x0 + 6} y={-46} fontSize={3}>
                TERAKHIR MASUK
              </text>
              <text className="sp-ink" x={GLASS.x0 + 6} y={-39.5} fontSize={4.6}>
                {last ? fitText(last.nama, 17) : "—"}
              </text>
              <text className="sp-ink-dim" x={GLASS.x0 + 6} y={-34} fontSize={3.4}>
                {last ? fitText(last.daerah, 22) : "Menunggu scan pertama"}
              </text>
              {/* Tanda tercatat (berkedip saat absen baru) */}
              <g ref={checkRef} opacity={0}>
                <rect className="sp-pill" x={-17} y={-29} width={34} height={7} rx={3.5} />
                <text className="sp-pill-ink" x={0} y={-24.1} fontSize={3.6} textAnchor="middle">
                  ✓ TERCATAT
                </text>
              </g>
              {/* Indikator home */}
              <path className="sp-home" d={`M-9 ${-(GLASS.z0 + 3)}H9`} />
            </g>
          </g>

          <g dangerouslySetInnerHTML={{ __html: ART_FRONT }} />
        </svg>
      </div>
    </Plate>
  );
}
