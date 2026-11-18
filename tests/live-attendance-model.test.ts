import { describe, expect, it } from "vitest";
import {
  LATEST_LIMIT,
  NO_OPEN_SESSION,
  belumOf,
  bumpSession,
  clockOf,
  fillOf,
  fitText,
  openLabel,
  percentOf,
  pushArrival,
  scanReadout,
  sessionInfoOf,
  ticketReadout,
  totalHadir,
  type LiveArrival,
  type LiveSessionCount,
} from "@/lib/live-attendance-model";

const isoma = sessionInfoOf({ id: 2, nama: "Masuk Setelah Isoma", hari: 1 });
const malam = sessionInfoOf({ id: 3, nama: "Masuk Setelah Makan Malam", hari: 1 });

const arrival = (id: string, nama = `Peserta ${id}`): LiveArrival => ({
  id,
  nama,
  daerah: "Jawa Timur",
  checkedInAt: "2026-11-18T02:05:00Z",
  sessionId: isoma.id,
  sessionLabel: isoma.label,
  sessionShort: isoma.short,
});

describe("live attendance model", () => {
  it("membuat label sesi lengkap dan singkat", () => {
    expect(isoma).toEqual({ id: 2, label: "Hari 1 · Masuk Setelah Isoma", short: "H1 Isoma" });
    expect(malam.short).toBe("H1 Malam");
    expect(sessionInfoOf({ id: 9, nama: "Penutupan" }).label).toBe("Penutupan");
  });

  it("label sesi dibuka untuk 0, 1, dan banyak sesi", () => {
    expect(openLabel([])).toBe(NO_OPEN_SESSION);
    expect(openLabel([isoma])).toBe("Hari 1 · Masuk Setelah Isoma");
    expect(openLabel([isoma, malam])).toBe("2 sesi dibuka: H1 Isoma, H1 Malam");
  });

  it("menghitung persen, isian, dan sisa dengan batas walk-in", () => {
    expect(percentOf(45, 300)).toBe(15);
    expect(percentOf(320, 300)).toBe(100);
    expect(percentOf(0, 0)).toBe(0);
    expect(fillOf(150, 300)).toBe(0.5);
    expect(belumOf(320, 300)).toBe(0);
  });

  it("menjumlah hadir semua sesi dibuka dan menambah per sesi", () => {
    const sessions: LiveSessionCount[] = [
      { ...isoma, hadir: 30 },
      { ...malam, hadir: 5 },
    ];
    expect(totalHadir(sessions)).toBe(35);
    expect(bumpSession(sessions, 3).map((s) => s.hadir)).toEqual([30, 6]);
    expect(bumpSession(sessions, 99)).toEqual(sessions);
  });

  it("menulis readout pemindai dan tiket", () => {
    expect(scanReadout({ sessions: [], total: 300 })).toBe(NO_OPEN_SESSION);
    expect(scanReadout({ sessions: [{ ...isoma, hadir: 120 }], total: 300 })).toBe("120/300 hadir · 40%");
    expect(scanReadout({ sessions: [{ ...isoma, hadir: 120 }, { ...malam, hadir: 4 }], total: 300 })).toBe("124 absen · 2 sesi dibuka");
    expect(ticketReadout([], false)).toBe(NO_OPEN_SESSION);
    expect(ticketReadout([])).toBe("Menunggu kedatangan pertama");
    expect(ticketReadout([arrival("a", "Ahmad Fauzi")])).toBe("Ahmad Fauzi · 09:05");
  });

  it("jam ditampilkan dalam WIB dan aman untuk tanggal rusak", () => {
    expect(clockOf("2026-11-18T23:30:00Z")).toBe("06:30");
    expect(clockOf("bukan tanggal")).toBe("--:--");
  });

  it("memotong teks panjang dengan elipsis", () => {
    expect(fitText("  Ahmad   Fauzi ", 20)).toBe("Ahmad Fauzi");
    expect(fitText("Muhammad Abdurrahman Al-Fatih", 12)).toBe("Muhammad Ab…");
  });

  it("menambah kedatangan di depan tanpa duplikat, membawa label sesinya", () => {
    let list: LiveArrival[] = [];
    for (let i = 0; i < 8; i++) list = pushArrival(list, arrival(String(i)));
    expect(list).toHaveLength(LATEST_LIMIT);
    expect(list[0]).toMatchObject({ id: "7", sessionLabel: "Hari 1 · Masuk Setelah Isoma" });
    list = pushArrival(list, arrival("5"));
    expect(list.map((a) => a.id)).toEqual(["5", "7", "6", "4", "3"]);
  });
});
