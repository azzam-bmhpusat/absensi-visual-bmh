"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CheckCircle2,
  UserPlus,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  CalendarCheck,
} from "lucide-react";

interface SessionChartData {
  id: number;
  nama: string;
  hari: number;
  shortLabel: string;
  count: number;
}

interface DashboardChartsProps {
  sessions: {
    id: number;
    nama: string;
    hari?: number;
  }[];
  attendancesCountBySession: Record<number, number>;
  totalGuests: number;
  totalAttendances: number;
  registeredCount: number;
  walkInCount: number;
}

export function DashboardCharts({
  sessions,
  attendancesCountBySession,
  totalGuests,
  totalAttendances,
  registeredCount,
  walkInCount,
}: DashboardChartsProps) {
  // Susun data untuk grafik batang kehadiran per sesi
  const barChartData: SessionChartData[] = useMemo(() => {
    return sessions.map((s) => {
      const h = s.hari ?? (s.id <= 3 ? 1 : s.id <= 6 ? 2 : 3);
      const localOrder = ((s.id - 1) % 3) + 1;
      const count = attendancesCountBySession[s.id] || 0;

      let shortTitle = "Pagi";
      if (localOrder === 2) shortTitle = "Isoma";
      if (localOrder === 3) shortTitle = "Malam";

      return {
        id: s.id,
        nama: s.nama,
        hari: h,
        shortLabel: `H${h}-S${localOrder} (${shortTitle})`,
        count,
      };
    });
  }, [sessions, attendancesCountBySession]);

  // Data untuk grafik pie komposisi tamu
  const pieData = useMemo(() => {
    return [
      { name: "Tamu Terdaftar", value: registeredCount, color: "#134B40" },
      { name: "Tamu Baru (Walk-in)", value: walkInCount, color: "#D4AF37" },
    ];
  }, [registeredCount, walkInCount]);

  // Rata-rata kehadiran per sesi
  const averageAttendance = useMemo(() => {
    if (sessions.length === 0) return 0;
    return Math.round(totalAttendances / sessions.length);
  }, [totalAttendances, sessions.length]);

  return (
    <div className="space-y-6">
      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-line bg-white shadow-2xs hover:border-brand-green/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-muted">
                Total Tamu Terdaftar
              </p>
              <p className="text-2xl font-bold font-heading text-primary">
                {totalGuests}
              </p>
              <p className="text-[11px] text-ink-muted">Database undangan</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary shrink-0">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-line bg-white shadow-2xs hover:border-brand-green/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-muted">
                Total Seluruh Presensi
              </p>
              <p className="text-2xl font-bold font-heading text-primary">
                {totalAttendances}
              </p>
              <p className="text-[11px] text-ink-muted">Akumulasi semua sesi</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-brand-green shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-line bg-white shadow-2xs hover:border-brand-green/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-muted">
                Tamu Baru (Walk-in)
              </p>
              <p className="text-2xl font-bold font-heading text-brand-gold-text">
                {walkInCount}
              </p>
              <p className="text-[11px] text-ink-muted">Presensi di luar daftar</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gold-50 flex items-center justify-center text-brand-gold shrink-0">
              <UserPlus className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-line bg-white shadow-2xs hover:border-brand-green/40 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-ink-muted">
                Rata-rata per Sesi
              </p>
              <p className="text-2xl font-bold font-heading text-primary">
                {averageAttendance}
              </p>
              <p className="text-[11px] text-ink-muted">Kehadiran per sesi acara</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <TrendingUp className="w-6 h-6 text-brand-green" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Grafik */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Batang: Kehadiran Per Sesi */}
        <Card className="lg:col-span-2 rounded-3xl border-line bg-white/95 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="font-heading text-base font-bold text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-green" />
                Statistik Kehadiran per Sesi Acara (9 Sesi)
              </CardTitle>
              <p className="text-xs text-ink-muted">
                Perbandingan jumlah peserta yang telah melakukan presensi di setiap sesi.
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-semibold border-brand-green/30 bg-green-50 text-brand-green-deep"
            >
              9 Sesi Acara
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as SessionChartData;
                        return (
                          <div className="bg-white p-2.5 rounded-xl border border-line shadow-md text-xs space-y-1">
                            <p className="font-bold text-primary">{`Hari ${data.hari}: ${data.nama}`}</p>
                            <p className="text-ink-muted">
                              Total Hadir:{" "}
                              <strong className="text-brand-green font-mono">
                                {data.count} Tamu
                              </strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barChartData.map((entry, index) => {
                      const colors = [
                        "#134B40",
                        "#1A6354",
                        "#247C6A",
                        "#D4AF37",
                        "#B8972E",
                        "#9C7F25",
                        "#1E40AF",
                        "#2563EB",
                        "#3B82F6",
                      ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grafik Pie: Komposisi Tamu */}
        <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-bold text-primary flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-brand-gold-text" />
              Komposisi Presensi
            </CardTitle>
            <p className="text-xs text-ink-muted">
              Rasio undangan terdaftar vs pendaftaran baru (walk-in).
            </p>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center justify-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0];
                        return (
                          <div className="bg-white p-2 rounded-xl border border-line shadow-md text-xs">
                            <span className="font-semibold text-primary">
                              {item.name}:
                            </span>{" "}
                            <span className="font-bold">{item.value} Tamu</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full space-y-2 pt-2 border-t border-line text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#134B40]" />
                  <span className="text-ink-muted">Undangan Terdaftar</span>
                </div>
                <span className="font-bold text-primary font-mono">
                  {registeredCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#D4AF37]" />
                  <span className="text-ink-muted">Tamu Baru (Walk-in)</span>
                </div>
                <span className="font-bold text-brand-gold-text font-mono">
                  {walkInCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
