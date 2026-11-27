"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { recordScan, type ScanResult } from "@/app/(admin)/scan-absen/actions";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "cn";

type Session = { id: number; nama: string; aktif: boolean };

const COOLDOWN_MS = 2500;
const SCAN_TOAST_ID = "scan-absen-result";

export function QrScanner({ sessions }: { sessions: Session[] }) {
  const isMobile = useIsMobile();
  const [sessionId, setSessionId] = useState<number | null>(sessions.find((s) => s.aktif)?.id ?? sessions[0]?.id ?? null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const busy = useRef(false);
  const last = useRef<{ token: string; at: number } | null>(null);
  const sessionRef = useRef(sessionId);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  const showResult = useEffectEvent((res: ScanResult) => {
    setResult(res);
    if (!isMobile) return;

    const options = { id: SCAN_TOAST_ID, duration: 5000, position: "top-center" as const };
    if (res.status === "error") {
      toast.error(res.message, { ...options, description: "" });
      return;
    }

    const details = { ...options, description: `${res.nama} — ${res.daerah} · ${res.sesi}` };
    if (res.status === "ok") {
      toast.success("Hadir tercatat", details);
    } else {
      toast.warning("Sudah tercatat sebelumnya", details);
    }
  });

  useEffect(() => {
    if (!isMobile) toast.dismiss(SCAN_TOAST_ID);
    return () => { toast.dismiss(SCAN_TOAST_ID); };
  }, [isMobile]);

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader");
    let started = false;
    let disposed = false;
    let cooldownTimer: ReturnType<typeof setTimeout> | undefined;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => {
          const now = Date.now();
          if (disposed || busy.current || sessionRef.current == null) return;
          if (last.current && last.current.token === text && now - last.current.at < COOLDOWN_MS * 2) return;
          busy.current = true;
          last.current = { token: text, at: now };
          try {
            const res = await recordScan(text, sessionRef.current);
            if (disposed) return;
            showResult(res);
            navigator.vibrate?.(res.status === "ok" ? 120 : [80, 60, 80]);
          } catch {
            if (!disposed) showResult({ status: "error", message: "Koneksi bermasalah. Coba lagi." });
          } finally {
            if (!disposed) cooldownTimer = setTimeout(() => (busy.current = false), COOLDOWN_MS);
          }
        },
        () => {},
      )
      .then(() => {
        started = true;
        if (disposed) scanner.stop().catch(() => {});
      })
      .catch(() => {
        if (!disposed) setCameraError("Kamera tidak dapat dibuka. Izinkan akses kamera dan pastikan memakai HTTPS.");
      });
    return () => {
      disposed = true;
      clearTimeout(cooldownTimer);
      busy.current = false;
      if (started) scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="min-w-0 space-y-5">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="scan-session" className="text-ink">Sesi absensi</Label>
        <Select
          items={sessions.map((s) => ({ value: s.id, label: `${s.nama}${s.aktif ? "" : " (ditutup)"}` }))}
          value={sessionId}
          onValueChange={setSessionId}
          disabled={sessions.length === 0}
        >
          <SelectTrigger
            id="scan-session"
            aria-describedby="scan-session-help"
            className="w-full min-w-0 rounded-xl border-line bg-white px-3 data-[size=default]:h-11"
          >
            <SelectValue className="min-w-0 truncate" placeholder={sessions.length ? "Pilih sesi" : "Belum ada sesi"} />
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false} className="max-h-[min(20rem,var(--available-height))] p-1">
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id} className="min-h-11 cursor-pointer py-2 pr-8 pl-3 [&>div]:min-w-0 [&>div]:shrink [&>div]:whitespace-normal">
                {s.nama}{s.aktif ? "" : " (ditutup)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id="scan-session-help" className="text-xs leading-relaxed text-ink-muted">
          {sessions.length ? "Pastikan sesi sesuai sebelum memindai QR peserta." : "Tambahkan sesi terlebih dahulu melalui Kelola Sesi Acara."}
        </p>
      </div>

      <div className="space-y-2">
        <div id="qr-reader" className="min-h-60 w-full overflow-hidden rounded-xl border border-line bg-black" />
        {cameraError ? (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm leading-relaxed text-red-700">{cameraError}</p>
        ) : (
          <p className="text-center text-xs leading-relaxed text-ink-muted">Posisikan QR di dalam bingkai kamera. Hasil scan akan muncul otomatis.</p>
        )}
      </div>

      {result && !isMobile && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "break-words rounded-xl p-4 text-sm",
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
