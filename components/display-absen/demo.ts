"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deriveAttendanceData, type AttendanceData, type GuestData, type SessionData } from "@/lib/display-helpers";
import type { LiveData } from "./live-data";

/** Mode gladi (?demo=1): tamu & absensi tiruan murni di klien, tidak menulis ke database. */
const NAMES = [
  "Ahmad Fauzi", "Siti Aisyah", "Muhammad Rizki", "Nur Hidayah", "Abdul Rahman", "Fatimah Zahra", "Hasan Basri", "Khadijah Amalia",
  "Yusuf Maulana", "Maryam Salsabila", "Umar Faruq", "Zainab Husna", "Ibrahim Khalil", "Aminah Rahmawati", "Ali Ridho", "Halimah Sa'diyah",
  "Salman Alfarisi", "Ruqayyah Nabila", "Bilal Hakim", "Sumayyah Putri", "Idris Maulidi", "Latifah Anwar", "Harun Ar-Rasyid", "Hafsah Azzahra",
  "Dzulkifli Ahmad", "Qonita Mazaya", "Mahmud Syauqi", "Nabila Kusuma", "Taufik Hidayat", "Wardah Safitri",
];
const REGIONS = [
  "Aceh", "Sumatera Utara", "Sumatera Barat", "Riau", "Jambi", "Lampung", "Banten", "Jawa Barat", "Jawa Tengah", "Jawa Timur",
  "Yogyakarta", "Kalimantan Selatan", "Sulawesi Selatan", "Nusa Tenggara Barat", "Bali", "Pusat",
];

export function makeDemoGuests(count = 120): GuestData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `demo-${i}`,
    nama: `${NAMES[i % NAMES.length]}${i >= NAMES.length ? ` ${Math.floor(i / NAMES.length) + 1}` : ""}`,
    perwakilan_daerah: REGIONS[(i * 7) % REGIONS.length],
    jabatan: i % 5 === 0 ? "Ketua Daerah" : null,
    departemen: null,
    kategori: null,
  }));
}

const demoAttendance = (guest: GuestData | null, n: number, session: number): AttendanceData => ({
  id: `da-${n}-${Math.round(Math.random() * 1e6)}`,
  session_id: session,
  guest_id: guest?.id ?? null,
  nama: guest?.nama ?? `Tamu Walk-in ${n}`,
  perwakilan_daerah: guest?.perwakilan_daerah ?? "Pusat",
  jabatan: guest?.jabatan ?? null,
  departemen: null,
  kategori: null,
  is_walk_in: !guest,
  checked_in_at: new Date().toISOString(),
});

export function useDemoLive(session: SessionData, intervalMs = 3200): LiveData {
  const guests = useMemo(() => makeDemoGuests(), []);
  const counter = useRef(0);
  const [attendances, setAttendances] = useState<AttendanceData[]>(() =>
    guests
      .filter((_, i) => i % 3 === 0)
      .map((g, i) => ({ ...demoAttendance(g, -i, session.id), checked_in_at: new Date(Date.now() - (60 - i) * 60_000).toISOString() }))
  );
  const [welcome, setWelcome] = useState<Array<{ id: string }>>([]);

  const latest = useRef(attendances);
  useEffect(() => {
    latest.current = attendances;
  }, [attendances]);

  useEffect(() => {
    const id = setInterval(() => {
      const present = new Set(latest.current.map((a) => a.guest_id).filter(Boolean));
      const absent = guests.filter((g) => !present.has(g.id));
      counter.current += 1;
      const walkIn = counter.current % 9 === 0 || absent.length === 0;
      const pick = walkIn ? null : absent[Math.floor(Math.random() * absent.length)];
      const next = demoAttendance(pick, counter.current, session.id);
      latest.current = [next, ...latest.current];
      setAttendances(latest.current);
      setWelcome((q) => [...q, { id: next.id }]);
    }, intervalMs);
    return () => clearInterval(id);
  }, [guests, session.id, intervalMs]);

  const dismissWelcome = useCallback((id: string) => setWelcome((q) => q.filter((w) => w.id !== id)), []);
  const derived = useMemo(() => deriveAttendanceData(guests, attendances, session.id), [guests, attendances, session.id]);
  return { session, guests, status: "connected", welcome, dismissWelcome, ...derived };
}
