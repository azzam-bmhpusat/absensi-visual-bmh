"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  deriveAttendanceData,
  type GuestData,
  type AttendanceData,
  type SessionData,
} from "@/lib/display-helpers";
import { DisplayCounter } from "./display-counter";
import { GuestChip } from "./guest-chip";
import { WelcomeBanner, type WelcomeItem } from "./welcome-banner";
import { AutoScrollContainer } from "./auto-scroll-container";
import { AnimatePresence, motion } from "motion/react";
import { Wifi, WifiOff } from "lucide-react";

interface AttendanceBoardProps {
  initialSessions: SessionData[];
  activeSession: SessionData;
  initialGuests: GuestData[];
  initialAttendances: AttendanceData[];
}

export function AttendanceBoard({
  activeSession,
  initialGuests,
  initialAttendances,
}: AttendanceBoardProps) {
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
      .channel(`attendances-display:${activeSession.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendances",
          filter: `session_id=eq.${activeSession.id}`,
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
  }, [activeSession.id, handleNewAttendance, supabase]);

  // 5. Fallback refetch berkala setiap 30 detik untuk ketahanan jaringan
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: latestAttendances, error: attError } = await supabase
          .from("attendances")
          .select("*")
          .eq("session_id", activeSession.id)
          .order("checked_in_at", { ascending: false });

        if (!attError && latestAttendances) {
          setAttendances(latestAttendances as AttendanceData[]);
          setConnectionStatus("connected");
        }

        const { data: latestGuests, error: guestError } = await supabase
          .from("guests")
          .select("id, nama, perwakilan_daerah")
          .order("perwakilan_daerah", { ascending: true })
          .order("nama", { ascending: true });

        if (!guestError && latestGuests) {
          setGuests(latestGuests as GuestData[]);
        }
      } catch {
        setConnectionStatus("reconnecting");
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeSession.id, supabase]);

  // 6. Derivasi data kehadiran
  const {
    hadir,
    belumHadir,
    groupedBelumHadir,
    totalGuests,
    hadirCount,
    percentage,
  } = useMemo(
    () => deriveAttendanceData(guests, attendances, activeSession.id),
    [guests, attendances, activeSession.id]
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
        isIdle ? "cursor-none" : ""
      }`}
    >
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

          <AutoScrollContainer className="flex-1 min-h-0 pr-1">
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
                        status={item.is_walk_in ? "walk-in" : "hadir"}
                        isRecent={recentAttendanceIds.includes(item.id)}
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

          <AutoScrollContainer className="flex-1 min-h-0 pr-1">
            {belumHadir.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xl text-brand-gold-soft font-semibold">
                Semua tamu undangan telah hadir!
              </div>
            ) : groupedBelumHadir ? (
              // Pengelompokan per daerah jika > 40 tamu
              <div className="space-y-5 pb-2">
                {Object.entries(groupedBelumHadir).map(([daerah, guestList]) => (
                  <div key={daerah} className="space-y-2">
                    <div className="text-lg font-heading font-semibold text-brand-gold-soft flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-gold" />
                      <span>{daerah}</span>
                      <span className="text-sm text-muted-foreground font-normal">
                        ({guestList.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      <AnimatePresence initial={false}>
                        {guestList.map((guest) => (
                          <motion.div
                            key={guest.id}
                            layout
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                          >
                            <GuestChip
                              nama={guest.nama}
                              perwakilanDaerah={guest.perwakilan_daerah}
                              status="belum"
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Tampilan grid 2 kolom standar
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
      <footer className="h-10 flex items-center justify-between text-base text-muted-foreground border-t border-border/40 pt-3">
        <div className="flex items-center gap-2.5">
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

        <div className="text-white/70">
          Scan QR untuk absen:{" "}
          <span className="text-brand-gold-soft font-semibold font-mono">
            {siteUrl ? `${siteUrl}/absen` : "/absen"}
          </span>
        </div>
      </footer>
    </div>
  );
}
