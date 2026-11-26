"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { recordScan, type ScanResult } from "@/app/(admin)/scan-absen/actions";
import { cn } from "cn";

type Session = { id: number; nama: string; aktif: boolean };

const COOLDOWN_MS = 2500;

export function QrScanner({ sessions }: { sessions: Session[] }) {
  const [sessionId, setSessionId] = useState<number | null>(sessions.find((s) => s.aktif)?.id ?? sessions[0]?.id ?? null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busy = useRef(false);
  const last = useRef<{ token: string; at: number } | null>(null);
  const sessionRef = useRef(sessionId);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    let started = false;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => {
          const now = Date.now();
          if (busy.current || sessionRef.current == null) return;
          if (last.current && last.current.token === text && now - last.current.at < COOLDOWN_MS * 2) return;
          busy.current = true;
          last.current = { token: text, at: now };
          try {
            const res = await recordScan(text, sessionRef.current);
            setResult(res);
            navigator.vibrate?.(res.status === "ok" ? 120 : [80, 60, 80]);
          } catch {
            setResult({ status: "error", message: "Koneksi bermasalah. Coba lagi." });
          } finally {
            setTimeout(() => (busy.current = false), COOLDOWN_MS);
          }
        },
        () => {},
      )
      .then(() => (started = true))
      .catch(() => setCameraError("Kamera tidak dapat dibuka. Izinkan akses kamera dan pastikan memakai HTTPS."));
    return () => {
      if (started) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-ink">
        Sesi
        <select
          className="mt-1 h-11 w-full rounded-xl border border-line bg-white px-3"
          value={sessionId ?? ""}
          onChange={(e) => setSessionId(Number(e.target.value))}
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
              {s.aktif ? "" : " (ditutup)"}
            </option>
          ))}
        </select>
      </label>

      <div id="qr-reader" className="overflow-hidden rounded-2xl border border-line bg-black" />
      {cameraError && <p className="text-sm text-red-600">{cameraError}</p>}

      {result && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-2xl p-4 text-sm",
            result.status === "ok" && "bg-green-50 text-green-900 ring-1 ring-green-200",
            result.status === "already" && "bg-amber-50 text-amber-900 ring-1 ring-amber-200",
            result.status === "error" && "bg-red-50 text-red-900 ring-1 ring-red-200",
          )}
        >
          {result.status === "error" ? (
            <p className="font-semibold">❌ {result.message}</p>
          ) : (
            <>
              <p className="font-semibold">
                {result.status === "ok" ? "✅ Hadir tercatat" : "⚠️ Sudah tercatat sebelumnya"} — {result.sesi}
              </p>
              <p className="mt-1 text-base font-bold">{result.nama}</p>
              <p>{result.daerah}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
