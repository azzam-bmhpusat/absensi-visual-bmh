"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { RoundedQr } from "@/components/admin/rounded-qr";

const ROTATE_MS = 30_000;

interface QrPayload {
  url: string;
  expiresAt: number;
  serverNow: number;
}

export function LiveQr({ eventName }: { eventName?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(ROTATE_MS / 1000);
  const offsetRef = useRef(0); // serverNow - Date.now()

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/absen-qr", { cache: "no-store" });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.url) {
        throw new Error(body?.message || `Gagal memuat QR (HTTP ${res.status})`);
      }
      const data = body as QrPayload;
      offsetRef.current = data.serverNow - Date.now();
      setUrl(data.url);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat QR");
    }
  }, []);

  useEffect(() => {
    let lastWindow = -1;
    const tick = () => {
      const serverNow = Date.now() + offsetRef.current;
      const window = Math.floor(serverNow / ROTATE_MS);
      setSecondsLeft(Math.ceil(((window + 1) * ROTATE_MS - serverNow) / 1000));
      if (window !== lastWindow) {
        lastWindow = window;
        void load();
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 text-center flex flex-col items-center gap-4 lg:gap-3 xl:gap-4">
      <div className="w-[min(80vw,62vh)] h-[min(80vw,62vh)] lg:w-[min(34vw,58vh)] lg:h-[min(34vw,58vh)] flex items-center justify-center select-none">
        {url ? (
          <RoundedQr value={url} level="M" margin={4} color="#095046" bgColor="#FBFBFA" className="w-full h-full" />
        ) : (
          <Loader2 className="w-10 h-10 animate-spin text-brand-green-text" />
        )}
      </div>

      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl sm:text-4xl lg:text-3xl xl:text-4xl font-bold text-primary tracking-tight">
          Scan untuk absen
        </h1>
        <p className="text-sm text-ink-muted flex items-center justify-center gap-1.5">
          <RefreshCw className="w-4 h-4 text-brand-green-text" />
          QR berganti dalam <span className="font-semibold text-primary tabular-nums">{secondsLeft} detik</span>
        </p>
        {error && <p className="text-sm text-danger font-medium">{error}</p>}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-ink-muted pt-3 border-t border-dotted border-ink-muted/40 w-full justify-center">
        <ShieldCheck className="w-4 h-4 text-brand-green-text" />
        <span>Gunakan HP masing-masing &bull; 1 HP hanya bisa absen 1 kali per sesi</span>
      </div>
      {eventName && <p className="text-[11px] text-ink-muted/80">{eventName}</p>}
    </div>
  );
}
