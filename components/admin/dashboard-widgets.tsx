"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  TrendingUp,
  UserPlus,
  CalendarCheck,
  Video,
  Clock,
  Pause,
  Square,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatWibClock } from "@/lib/display-helpers";

const BRAND = "#095046";
const GREEN = "#39BA87";
const GOLD = "#FEB738";

interface SessionChartData {
  id: number;
  nama: string;
  hari: number;
  shortLabel: string;
  count: number;
}

function buildBarChartData(
  sessions: { id: number; nama: string; hari?: number }[],
  attendancesCountBySession: Record<number, number>
): SessionChartData[] {
  return sessions.map((s) => {
    const h = s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3);
    const localOrder = ((s.id - 1) % 3) + 1;
    const count = attendancesCountBySession[s.id] || 0;

    return {
      id: s.id,
      nama: s.nama,
      hari: h,
      shortLabel: `H${h}-S${localOrder}`,
      count,
    };
  });
}

/* ================= Stat Cards ================= */

interface DashboardStatCardsProps {
  totalGuests: number;
  totalAttendances: number;
  walkInCount: number;
  activeSessionsCount: number;
  sessionsCount: number;
}

export function DashboardStatCards({
  totalGuests,
  totalAttendances,
  walkInCount,
  activeSessionsCount,
  sessionsCount,
}: DashboardStatCardsProps) {
  const arrowCircle =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Kartu highlight hijau solid */}
      <div className="rounded-2xl bg-primary p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium text-emerald-100/90">
            Total Tamu Terdaftar
          </p>
          <div className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-white">
            <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <p className="mt-3 font-heading text-4xl font-bold text-white">
          {totalGuests}
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gold-soft px-2.5 py-1 text-[11px] font-semibold text-brand-green-night">
          <TrendingUp className="h-3 w-3" />
          Database undangan
        </span>
      </div>

      {/* Kartu putih */}
      {[
        {
          title: "Total Seluruh Presensi",
          value: totalAttendances,
          chip: "Akumulasi semua sesi",
          chipClass: "bg-green-100 text-brand-green-deep",
          icon: <TrendingUp className="h-3 w-3" />,
        },
        {
          title: "Tamu Baru (Walk-in)",
          value: walkInCount,
          chip: "Presensi di luar daftar",
          chipClass: "bg-gold-100 text-brand-gold-text",
          icon: <UserPlus className="h-3 w-3" />,
        },
        {
          title: "Sesi Aktif",
          value: activeSessionsCount,
          chip: `Dari ${sessionsCount} sesi acara`,
          chipClass: "bg-green-100 text-brand-green-deep",
          icon: <CalendarCheck className="h-3 w-3" />,
        },
      ].map((s) => (
        <Card
          key={s.title}
          className="rounded-2xl border-line bg-white shadow-2xs"
        >
          <CardContent className="flex h-full flex-col p-5">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-ink-muted">{s.title}</p>
              <div className={`ml-auto ${arrowCircle} bg-surface`}>
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
            <p className="mt-3 font-heading text-4xl font-bold text-primary">
              {s.value}
            </p>
            <span
              className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.chipClass}`}
            >
              {s.icon}
              {s.chip}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ================= Bar Chart ================= */

interface SessionBarChartProps {
  sessions: { id: number; nama: string; hari?: number }[];
  attendancesCountBySession: Record<number, number>;
}

export function SessionBarChart({
  sessions,
  attendancesCountBySession,
}: SessionBarChartProps) {
  const barChartData = useMemo(
    () => buildBarChartData(sessions, attendancesCountBySession),
    [sessions, attendancesCountBySession]
  );

  const colors = [BRAND, GREEN, BRAND, GREEN, GOLD, BRAND, GREEN, BRAND, GREEN];

  return (
    <Card className="rounded-3xl border-line bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-heading text-base font-bold text-primary">
          Presensi per Sesi Acara
        </CardTitle>
        <Badge className="border-0 bg-green-100 text-[11px] font-bold text-brand-green-deep">
          {sessions.length} Sesi Acara
        </Badge>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 8, right: 4, left: 4, bottom: 4 }}>
              <XAxis
                dataKey="shortLabel"
                tick={{ fontSize: 10, fill: "#5B6F68" }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis hide domain={[0, "dataMax + 1"]} />
              <Tooltip
                cursor={{ fill: "rgba(63,191,143,0.08)" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as SessionChartData;
                    return (
                      <div className="space-y-1 rounded-xl border border-line bg-white p-2.5 text-xs shadow-md">
                        <p className="font-bold text-primary">
                          {`Hari ${data.hari}: ${data.nama}`}
                        </p>
                        <p className="text-ink-muted">
                          Total Hadir:{" "}
                          <strong className="font-mono text-brand-green">
                            {data.count} Tamu
                          </strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" barSize={30} radius={[999, 999, 999, 999]}>
                {barChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= Composition Gauge ================= */

interface CompositionGaugeProps {
  registeredCount: number;
  walkInCount: number;
}

export function CompositionGauge({
  registeredCount,
  walkInCount,
}: CompositionGaugeProps) {
  const total = registeredCount + walkInCount;
  const pct = total > 0 ? Math.round((registeredCount / total) * 100) : 0;

  const r = 62;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <Card className="rounded-3xl border-line bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base font-bold text-primary">
          Komposisi Presensi
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 pt-1">
        <div className="relative h-[160px] w-[160px]">
          <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke="#DDE7E2"
              strokeWidth="14"
            />
            <circle
              cx="80"
              cy="80"
              r={r}
              fill="none"
              stroke={BRAND}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${c - dash}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-heading text-2xl font-bold text-primary">
              {pct}%
            </span>
            <span className="text-[11px] text-ink-muted">Terdaftar</span>
          </div>
        </div>

        <div className="flex w-full items-center justify-center gap-4 border-t border-line pt-3 text-xs">
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-[#095046]" />
            Terdaftar
            <strong className="text-primary">{registeredCount}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full bg-[#FEB738]" />
            Walk-in
            <strong className="text-brand-gold-text">{walkInCount}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================= Next Session ================= */

interface NextSessionCardProps {
  activeSession: { id: number; nama: string; hari: number } | null;
}

export function NextSessionCard({ activeSession }: NextSessionCardProps) {
  return (
    <Card className="rounded-3xl border-line bg-white shadow-sm">
      <CardContent className="flex h-full flex-col gap-2 p-5">
        <CardTitle className="font-heading text-base font-bold text-primary">
          Sesi Berikutnya
        </CardTitle>
        {activeSession ? (
          <>
            <p className="font-heading text-xl font-bold text-primary">
              {activeSession.nama}
            </p>
            <p className="text-xs text-ink-muted">
              Hari {activeSession.hari} • Sesi sedang berjalan
            </p>
          </>
        ) : (
          <>
            <p className="font-heading text-xl font-bold text-primary">
              Tidak Ada Sesi Aktif
            </p>
            <p className="text-xs text-ink-muted">
              Aktifkan sesi pada menu Kelola Sesi Acara.
            </p>
          </>
        )}
        <div className="grow" />
        <Link
          href="/display"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-green-deep"
        >
          <Video className="h-4 w-4" />
          Buka Videotron
        </Link>
      </CardContent>
    </Card>
  );
}

/* ================= Session Tracker (live WIB clock) ================= */

export function SessionTracker() {
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setClock(formatWibClock(new Date()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const time = clock ? clock.replace(" WIB", "") : "--:--:--";

  return (
    <div className="rounded-3xl bg-gradient-to-b from-primary to-brand-green-night p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-brand-gold-soft" />
        <p className="text-xs font-medium text-emerald-100/90">
          Waktu Server (WIB)
        </p>
      </div>
      <p className="mt-3 font-heading text-3xl font-bold tabular-nums text-white">
        {time}
      </p>
      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <Pause className="h-4 w-4 text-primary" />
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D14343]">
          <Square className="h-3.5 w-3.5 text-white" />
        </span>
        <span className="text-[11px] text-emerald-100/70">
          Kontrol sesi dari Kelola Sesi Acara
        </span>
      </div>
    </div>
  );
}
