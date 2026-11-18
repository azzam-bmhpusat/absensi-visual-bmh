"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  deriveAttendanceData,
  type GuestData,
  type AttendanceData,
  type SessionData,
} from "@/lib/display-helpers";
import { DisplayHeader } from "./display-header";
import { DisplayCounter } from "./display-counter";
import { GuestChip } from "./guest-chip";
import { WelcomeBanner, type WelcomeItem } from "./welcome-banner";
import { AutoScrollContainer } from "./auto-scroll-container";
import { AnimatePresence, motion } from "motion/react";
import { Wifi, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";

interface AttendanceBoardProps {
  eventName?: string;
  initialSessions: SessionData[];
  activeSession: SessionData;
  initialGuests: GuestData[];
  initialAttendances: AttendanceData[];
}

export function AttendanceBoard({
  eventName = "Silaturahim & Rapat Kerja Nasional BMH 2026",
  initialSessions = [],
  activeSession,
  initialGuests,
  initialAttendances,
}: AttendanceBoardProps) {
  const router = useRouter();
  const [currentSession, setCurrentSession] = useState<SessionData>(activeSession);
  const [guests, setGuests] = useState<GuestData[]>(initialGuests);
  const [attendances, setAttendances] =
    useState<AttendanceData[]>(initialAttendances);
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "reconnecting"
  >("connected");
  const [recentAttendanceIds, setRecentAttendanceIds] = useState<string[]>([]);
  const [welcomeQueue, setWelcomeQueue] = useState<WelcomeItem[]>([]);
  const [isIdle, setIsIdle] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  // Sinkronisasi state ketika prop dari server component berubah (React recommended pattern)
  const [prevActiveSession, setPrevActiveSession] = useState(activeSession);
  if (activeSession !== prevActiveSession) {
    setPrevActiveSession(activeSession);
    setCurrentSession(activeSession);
  }

  const [prevGuests, setPrevGuests] = useState(initialGuests);
  if (initialGuests !== prevGuests) {
    setPrevGuests(initialGuests);
    setGuests(initialGuests);
  }

  const [prevAttendances, setPrevAttendances] = useState(initialAttendances);
  if (initialAttendances !== prevAttendances) {
    setPrevAttendances(initialAttendances);
    setAttendances(initialAttendances);
  }

  // 1. Sembunyikan kursor mouse saat idle (3 detik)
  useEffect(() => {
    let idleTimer: NodeJS.Timeout;

    const resetIdle = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 3000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("mousedown", resetIdle);
    resetIdle();

    return () => {
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("mousedown", resetIdle);
      clearTimeout(idleTimer);
    };
  }, []);

  // 2. Handler untuk menghapus banner sambutan yang selesai
  const handleDismissWelcome = useCallback((id: string) => {
    setWelcomeQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // 3. Handler saat ada absensi baru
  const handleNewAttendance = useCallback((newRow: AttendanceData) => {
    setAttendances((prev) => {
      if (prev.some((a) => a.id === newRow.id)) return prev;
      return [newRow, ...prev];
    });

    // Sorotan cincin emas selama 5 detik
    setRecentAttendanceIds((prev) => [...prev, newRow.id]);
    setTimeout(() => {
      setRecentAttendanceIds((prev) => prev.filter((id) => id !== newRow.id));
    }, 5000);

    // Tambah ke antrean banner sambutan
    setWelcomeQueue((prev) => [
      ...prev,
      {
        id: newRow.id,
        nama: newRow.nama,
        daerah: newRow.perwakilan_daerah,
        jabatan: newRow.jabatan,
        departemen: newRow.departemen,
        kategori: newRow.kategori,
      },
    ]);
  }, []);

  // 4. Supabase Realtime Subscription + Online/Offline listeners
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("connected");
    const handleOffline = () => setConnectionStatus("reconnecting");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const channel = supabase
      .channel(`attendances-display:${currentSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendances",
          filter: `session_id=eq.${currentSession.id}`,
        },
        (payload) => {
          if (payload.new) {
            handleNewAttendance(payload.new as AttendanceData);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("connected");
        } else if (
          status === "TIMED_OUT" ||
          status === "CLOSED" ||
          status === "CHANNEL_ERROR"
        ) {
          setConnectionStatus("reconnecting");
        }
      });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      supabase.removeChannel(channel);
    };
  }, [currentSession.id, handleNewAttendance, supabase]);

  // 5. Load data sesi segera saat currentSession.id berubah + polling berkala 30 detik
  useEffect(() => {
    let isCancelled = false;

    const loadSessionData = async () => {
      try {
        const [attRes, guestsRes] = await Promise.all([
          supabase
            .from("attendances")
            .select(
              "id, session_id, guest_id, nama, perwakilan_daerah, jabatan, departemen, kategori, is_walk_in, checked_in_at"
            )
            .eq("session_id", currentSession.id)
            .order("checked_in_at", { ascending: false }),
          supabase
            .from("guests")
            .select("id, nama, perwakilan_daerah, jabatan, departemen, kategori")
            .order("perwakilan_daerah", { ascending: true })
            .order("nama", { ascending: true }),
        ]);

        if (isCancelled) return;

        if (!attRes.error && attRes.data) {
          setAttendances(attRes.data as AttendanceData[]);
          setConnectionStatus("connected");
        }

        if (!guestsRes.error && guestsRes.data) {
          setGuests(guestsRes.data as GuestData[]);
        }
      } catch {
        if (!isCancelled) {
          setConnectionStatus("reconnecting");
        }
      }
    };

    // Panggil SEGERA begitu currentSession.id berubah
    loadSessionData();

    const interval = setInterval(loadSessionData, 30000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [currentSession.id, supabase]);

  // 6. Handler klik sesi instan (update state & fetch langsung tanpa tunggu reload)
  const handleSelectSession = async (session: SessionData) => {
    if (session.id === currentSession.id) return;

    // 1. Update sesi seketika (optimistic UI)
    setCurrentSession(session);
    setRecentAttendanceIds([]);
    setWelcomeQueue([]);

    // 2. Fetch data kehadiran sesi terpilih seketika dari Supabase client
    try {
      const { data, error } = await supabase
        .from("attendances")
        .select(
          "id, session_id, guest_id, nama, perwakilan_daerah, jabatan, departemen, kategori, is_walk_in, checked_in_at"
        )
        .eq("session_id", session.id)
        .order("checked_in_at", { ascending: false });

      if (!error && data) {
        setAttendances(data as AttendanceData[]);
        setConnectionStatus("connected");
      }
    } catch (err) {
      console.error("Gagal memuat absensi sesi:", err);
    }

    // 3. Update URL browser secara halus tanpa reload halaman penuh
    router.push(`/display?sesi=${session.id}`, { scroll: false });
  };

  // 7. Derivasi data kehadiran
  const {
    hadir,
    belumHadir,
    totalGuests,
    hadirCount,
    percentage,
  } = useMemo(
    () => deriveAttendanceData(guests, attendances, currentSession.id),
    [guests, attendances, currentSession.id]
  );

  return (
    <div
      className={`flex-1 flex flex-col justify-between min-h-0 overflow-hidden ${isIdle ? "cursor-none" : ""
        }`}
    >
      {/* Header Display */}
      <DisplayHeader
        eventName={eventName}
        sessionName={currentSession.nama}
      />

      {/* Counter & Progress */}
      <DisplayCounter
        hadir={hadirCount}
        total={totalGuests}
        percentage={percentage}
      />

      {/* Banner Sambutan 5 Detik */}
      <WelcomeBanner queue={welcomeQueue} onDismiss={handleDismissWelcome} />

      {/* Dua Kolom 50/50: Sudah Hadir & Belum Hadir */}
      <div className="grid grid-cols-2 gap-8 flex-1 min-h-0 overflow-hidden my-2">
        {/* Kolom Sudah Hadir */}
        <div className="flex flex-col min-h-0 bg-black/10 rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between border-b-2 border-brand-green pb-3 mb-3">
            <h2 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
              <span>Sudah Hadir</span>
              <span className="text-xl px-3 py-0.5 rounded-full bg-brand-green text-[#0A3A30] font-bold">
                {hadir.length}
              </span>
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              Terbaru di atas
            </span>
          </div>

          <AutoScrollContainer className="flex-1 min-h-0 pr-1" enabled={hadir.length > 0}>
            {hadir.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xl text-muted-foreground font-medium">
                Belum ada kehadiran tercatat pada sesi ini
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3.5 pb-2">
                <AnimatePresence initial={false}>
                  {hadir.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: -16, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      <GuestChip
                        nama={item.nama}
                        perwakilanDaerah={item.perwakilan_daerah}
                        jabatan={item.jabatan}
                        departemen={item.departemen}
                        kategori={item.kategori}
                        status={item.is_walk_in ? "walk-in" : "hadir"}
                        isRecent={recentAttendanceIds.includes(item.id)}
                        checkedInAt={item.checked_in_at}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AutoScrollContainer>
        </div>

        {/* Kolom Belum Hadir */}
        <div className="flex flex-col min-h-0 bg-black/10 rounded-2xl p-4 border border-border/30">
          <div className="flex items-center justify-between border-b-2 border-brand-gold pb-3 mb-3">
            <h2 className="text-3xl font-heading font-bold text-white tracking-tight flex items-center gap-3">
              <span>Belum Hadir</span>
              <span className="text-xl px-3 py-0.5 rounded-full bg-brand-gold text-[#0A3A30] font-bold">
                {belumHadir.length}
              </span>
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              Urut perwakilan daerah
            </span>
          </div>

          <AutoScrollContainer className="flex-1 min-h-0 pr-1" enabled={belumHadir.length > 0}>
            {belumHadir.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xl text-brand-gold-soft font-semibold">
                Semua tamu undangan telah hadir!
              </div>
            ) : (
              // Grid 2 kolom rata (urut perwakilan daerah → nama)
              <div className="grid grid-cols-2 gap-3.5 pb-2">
                <AnimatePresence initial={false}>
                  {belumHadir.map((guest) => (
                    <motion.div
                      key={guest.id}
                      layout
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GuestChip
                        nama={guest.nama}
                        perwakilanDaerah={guest.perwakilan_daerah}
                        jabatan={guest.jabatan}
                        departemen={guest.departemen}
                        kategori={guest.kategori}
                        status="belum"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </AutoScrollContainer>
        </div>
      </div>

      {/* Footer */}
      <footer className="min-h-[52px] xl:min-h-[56px] flex items-center justify-between px-2 xl:px-4 text-sm xl:text-base text-muted-foreground border-t border-border/40 pt-2 pb-1 gap-2 xl:gap-4 shrink-0">
        <div className="flex items-center gap-2.5 shrink-0 min-w-0">
          {connectionStatus === "connected" ? (
            <>
              <span className="w-3 h-3 rounded-full bg-brand-green animate-pulse shadow-[0_0_10px_#3FBF8F]" />
              <Wifi className="w-4 h-4 text-brand-green" />
              <span className="text-white/80 font-medium">Terhubung ke sistem</span>
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-full bg-brand-gold animate-ping" />
              <WifiOff className="w-4 h-4 text-brand-gold" />
              <span className="text-brand-gold font-medium">Menyambung ulang…</span>
            </>
          )}
        </div>

        {/* Navigasi 9 Sesi Acara Berada di Bagian Tengah Footer */}
        {initialSessions && initialSessions.length > 1 && (
          <nav aria-label="Navigasi Sesi Acara" className="flex items-center justify-center flex-1 max-w-full min-w-0 px-2">
            <div className="flex items-center gap-1 xl:gap-1.5 p-1 rounded-xl xl:rounded-2xl bg-black/35 border border-white/10 shadow-lg max-w-full overflow-x-auto scrollbar-none">
              {initialSessions.map((s) => {
                const isCurrent = s.id === currentSession.id;
                const h = s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3);
                const shortName = s.nama.includes("Pagi")
                  ? "Pagi"
                  : s.nama.includes("Isoma")
                    ? "Isoma"
                    : s.nama.includes("Malam")
                      ? "Malam"
                      : s.nama;

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    type="button"
                    className={`px-2.5 xl:px-3 py-1 xl:py-1.5 rounded-lg xl:rounded-xl text-[11px] xl:text-xs font-heading font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${isCurrent
                        ? "bg-brand-gold-soft text-[#0A3A30] shadow-md scale-100 font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    title={`Hari ${h}: ${s.nama}`}
                  >
                    {`H${h}: ${shortName}`}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        <div className="text-white/70 text-right shrink-0 whitespace-nowrap">
          Scan QR untuk absen{" "}
          <span className="text-brand-gold-soft font-semibold">
            di pintu masuk
          </span>
        </div>
      </footer>
    </div>
  );
}
