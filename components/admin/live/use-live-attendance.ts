"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { resolveActiveSession, type SessionData } from "@/lib/display-helpers";
import {
  LATEST_LIMIT,
  bumpSession,
  pushArrival,
  sessionInfoOf,
  type LiveArrival,
  type LiveSessionCount,
  type LiveSessionInfo,
  type LiveSnapshot,
} from "@/lib/live-attendance-model";

export type LiveStatus = "connecting" | "live" | "reconnecting";

export interface LiveAttendance extends LiveSnapshot {
  status: LiveStatus;
  /** Bertambah setiap ada absen baru yang masuk lewat realtime — pemicu animasi. */
  pulse: number;
  /** false sampai daftar sesi pertama kali termuat. */
  ready: boolean;
}

interface AttendanceRow {
  id: string;
  session_id: number;
  nama: string;
  perwakilan_daerah: string;
  checked_in_at: string;
}

const SESSIONS_POLL_MS = 15_000; // tabel sessions tidak ada di publikasi realtime
const COUNTS_POLL_MS = 30_000;

/** Sesi yang dibuka: semua is_active, atau satu sesi dari ?sesi= bila diberikan. */
function openSessionsOf(rows: SessionData[], querySesi?: string | null): LiveSessionInfo[] {
  if (querySesi) return [sessionInfoOf(resolveActiveSession(rows, querySesi))];
  return rows.filter((s) => s.is_active).map(sessionInfoOf);
}

export function useLiveAttendance(querySesi?: string | null): LiveAttendance {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState<LiveSessionInfo[]>([]);
  const [state, setState] = useState<LiveAttendance>({
    sessions: [],
    total: 0,
    latest: [],
    status: "connecting",
    pulse: 0,
    ready: false,
  });
  const seen = useRef(new Set<string>());
  const openKey = open.map((s) => s.id).join(",");

  // 1. Daftar sesi yang dibuka + total tamu (polling, karena sessions tidak realtime)
  const loadSessions = useCallback(() => {
    Promise.all([
      supabase.from("sessions").select("id, slug, nama, tanggal, hari, is_active").order("id"),
      supabase.from("guests").select("id", { count: "exact", head: true }),
    ])
      .then(([sessRes, guestRes]) => {
        if (sessRes.error) return;
        const next = openSessionsOf(sessRes.data ?? [], querySesi);
        setOpen((prev) =>
          prev.length === next.length && prev.every((s, i) => s.id === next[i].id && s.label === next[i].label) ? prev : next
        );
        setState((prev) => ({ ...prev, total: guestRes.count ?? prev.total, ready: true }));
      })
      .catch((err) => console.error("Gagal memuat sesi untuk QR live:", err));
  }, [supabase, querySesi]);

  useEffect(() => {
    const first = setTimeout(loadSessions, 0);
    const id = setInterval(loadSessions, SESSIONS_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [loadSessions]);

  // 2. Hitungan per sesi + kedatangan terbaru dari semua sesi yang dibuka
  const reload = useCallback(() => {
    const byId = new Map(open.map((s) => [s.id, s]));
    if (open.length === 0) {
      setState((prev) => ({ ...prev, sessions: [], latest: [] }));
      return;
    }
    const ids = open.map((s) => s.id);
    Promise.all([
      Promise.all(
        ids.map((id) => supabase.from("attendances").select("id", { count: "exact", head: true }).eq("session_id", id))
      ),
      supabase
        .from("attendances")
        .select("id, session_id, nama, perwakilan_daerah, checked_in_at")
        .in("session_id", ids)
        .order("checked_in_at", { ascending: false })
        .limit(LATEST_LIMIT),
    ])
      .then(([counts, latestRes]) => {
        if (latestRes.error || counts.some((c) => c.error)) return;
        const sessions: LiveSessionCount[] = open.map((s, i) => ({ ...s, hadir: counts[i].count ?? 0 }));
        const latest = (latestRes.data ?? []).map((row) => toArrival(row, byId));
        latest.forEach((item) => seen.current.add(item.id));
        setState((prev) => ({ ...prev, sessions, latest }));
      })
      .catch((err) => console.error("Gagal memuat data absen untuk QR live:", err));
  }, [open, supabase]);

  useEffect(() => {
    const first = setTimeout(reload, 0);
    const id = setInterval(reload, COUNTS_POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [reload]);

  // 3. Realtime: INSERT di sesi yang dibuka menambah; DELETE memicu muat ulang
  useEffect(() => {
    if (!openKey) return;
    const byId = new Map(open.map((s) => [s.id, s]));
    const channel = supabase
      .channel(`attendances-qr-live:${openKey}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendances", filter: `session_id=in.(${openKey})` },
        (payload) => {
          const row = payload.new as AttendanceRow;
          if (!row?.id || !byId.has(row.session_id) || seen.current.has(row.id)) return;
          seen.current.add(row.id);
          setState((prev) => ({
            ...prev,
            sessions: bumpSession(prev.sessions, row.session_id),
            latest: pushArrival(prev.latest, toArrival(row, byId)),
            pulse: prev.pulse + 1,
          }));
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "attendances" }, () => reload())
      .subscribe((status) => {
        setState((prev) => ({
          ...prev,
          status:
            status === "SUBSCRIBED"
              ? "live"
              : status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT"
                ? "reconnecting"
                : prev.status,
        }));
      });
    return () => {
      void supabase.removeChannel(channel);
    };
    // `open` diwakili oleh `openKey` (id sesi) agar saluran tidak dibuat ulang tanpa perubahan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey, supabase, reload]);

  return state;
}

function toArrival(row: AttendanceRow, byId: Map<number, LiveSessionInfo>): LiveArrival {
  const session = byId.get(row.session_id);
  return {
    id: row.id,
    nama: row.nama,
    daerah: row.perwakilan_daerah,
    checkedInAt: row.checked_in_at,
    sessionId: row.session_id,
    sessionLabel: session?.label ?? `Sesi ${row.session_id}`,
    sessionShort: session?.short ?? `S${row.session_id}`,
  };
}
