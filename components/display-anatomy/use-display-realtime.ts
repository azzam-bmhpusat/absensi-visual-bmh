"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  deriveAttendanceData,
  type AttendanceData,
  type GuestData,
  type SessionData,
} from "@/lib/display-helpers";
import { ATTENDANCE_COLUMNS, GUEST_COLUMNS } from "@/lib/display-anatomy-model";

export type ConnectionStatus = "connected" | "reconnecting";

export interface WelcomeItem {
  id: string;
  nama: string;
  daerah: string;
  checkedInAt: string;
}

const RECENT_MS = 5000;
const POLL_MS = 30_000;

/**
 * Data realtime /display-anatomy — perilaku sama dengan AttendanceBoard di /display:
 * INSERT/DELETE realtime per sesi, polling 30 detik, pindah sesi optimistis, antrean sambutan.
 */
export function useDisplayRealtime({
  initialSession,
  initialGuests,
  initialAttendances,
}: {
  initialSession: SessionData;
  initialGuests: GuestData[];
  initialAttendances: AttendanceData[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState(initialSession);
  const [guests, setGuests] = useState(initialGuests);
  const [attendances, setAttendances] = useState(initialAttendances);
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [welcome, setWelcome] = useState<WelcomeItem[]>([]);

  const handleInsert = useCallback((row: AttendanceData) => {
    setAttendances((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
    setRecentIds((prev) => [...prev, row.id]);
    setTimeout(() => setRecentIds((prev) => prev.filter((id) => id !== row.id)), RECENT_MS);
    setWelcome((prev) => [...prev, { id: row.id, nama: row.nama, daerah: row.perwakilan_daerah, checkedInAt: row.checked_in_at }]);
  }, []);

  const loadSessionData = useCallback(
    (sessionId: number) =>
      Promise.all([
        supabase.from("attendances").select(ATTENDANCE_COLUMNS).eq("session_id", sessionId).order("checked_in_at", { ascending: false }),
        supabase.from("guests").select(GUEST_COLUMNS).order("perwakilan_daerah", { ascending: true }).order("nama", { ascending: true }),
      ]),
    [supabase]
  );

  // Realtime per sesi
  useEffect(() => {
    const onOnline = () => setStatus("connected");
    const onOffline = () => setStatus("reconnecting");
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const channel = supabase
      .channel(`attendances-display-anatomy:${session.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendances", filter: `session_id=eq.${session.id}` },
        (payload) => payload.new && handleInsert(payload.new as AttendanceData)
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "attendances" }, (payload) => {
        const old = payload.old as { id?: string };
        if (old?.id) setAttendances((prev) => prev.filter((a) => a.id !== old.id));
      })
      .subscribe((s) => {
        if (s === "SUBSCRIBED") setStatus("connected");
        else if (s === "TIMED_OUT" || s === "CLOSED" || s === "CHANNEL_ERROR") setStatus("reconnecting");
      });

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      void supabase.removeChannel(channel);
    };
  }, [session.id, supabase, handleInsert]);

  // Polling cadangan
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      loadSessionData(session.id)
        .then(([attRes, guestRes]) => {
          if (cancelled) return;
          if (!attRes.error && attRes.data) {
            setAttendances(attRes.data as AttendanceData[]);
            setStatus("connected");
          }
          if (!guestRes.error && guestRes.data) setGuests(guestRes.data as GuestData[]);
        })
        .catch(() => !cancelled && setStatus("reconnecting"));
    };
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [session.id, loadSessionData]);

  /** Pindah sesi seketika (optimistis), lalu perbarui URL tanpa reload. */
  const selectSession = useCallback(
    (next: SessionData) => {
      if (next.id === session.id) return;
      setSession(next);
      setRecentIds([]);
      setWelcome([]);
      loadSessionData(next.id)
        .then(([attRes]) => {
          if (!attRes.error && attRes.data) {
            setAttendances(attRes.data as AttendanceData[]);
            setStatus("connected");
          }
        })
        .catch((err) => console.error("Gagal memuat absensi sesi:", err));
      router.push(`/display-anatomy?sesi=${next.id}`, { scroll: false });
    },
    [session.id, loadSessionData, router]
  );

  const dismissWelcome = useCallback((id: string) => setWelcome((prev) => prev.filter((w) => w.id !== id)), []);

  const derived = useMemo(() => deriveAttendanceData(guests, attendances, session.id), [guests, attendances, session.id]);

  return { session, guests, status, recentIds, welcome, dismissWelcome, selectSession, ...derived };
}
