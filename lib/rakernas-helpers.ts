// lib/rakernas-helpers.ts
// Helper fungsi waktu, countdown, dan pemrosesan rundown Rakernas BMH
import { DEFAULT_EVENT_SETTINGS, getEventDays, toWibDateTime } from "@/lib/event-settings";

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formatted: {
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  isExpired: boolean;
}

/**
 * Menghitung sisa waktu menuju target.
 * Jika target telah lewat atau sama dengan sekarang, mengembalikan 00 dan isExpired: true.
 */
export function getTimeLeft(
  targetInput: string | Date | number,
  nowInput: string | Date | number = new Date()
): TimeLeft {
  const targetMs = new Date(targetInput).getTime();
  const nowMs = new Date(nowInput).getTime();

  if (isNaN(targetMs) || isNaN(nowMs) || targetMs <= nowMs) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      },
      isExpired: true,
    };
  }

  const diffMs = targetMs - nowMs;
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    formatted: {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    },
    isExpired: false,
  };
}

/**
 * Menentukan default tab rundown berdasarkan tanggal WIB (Asia/Jakarta, UTC+7).
 * Default tab mengikuti hari acara dalam WIB; di luar rentang acara kembali ke Hari 1.
 */
export function getDefaultDay(
  nowInput: string | Date | number = new Date(),
  startsAt: string = DEFAULT_EVENT_SETTINGS.startsAt
): "hari1" | "hari2" | "hari3" {
  const d = new Date(nowInput);
  if (isNaN(d.getTime())) {
    return "hari1";
  }

  try {
    const index = getEventDays(startsAt).indexOf(toWibDateTime(d).slice(0, 10));
    return (["hari1", "hari2", "hari3"] as const)[index] ?? "hari1";
  } catch {
    return "hari1";
  }
}

/**
 * Memisahkan judul acara utama dan catatan/keterangan dalam tanda kurung
 * untuk kebutuhan styling dua baris yang rapi pada timeline.
 */
export function parseRundownTitle(
  title: string,
  explicitNote?: string
): { mainTitle: string; subtitle?: string } {
  if (explicitNote && explicitNote.trim().length > 0) {
    const cleanNote = explicitNote.trim();
    const pattern = new RegExp(`\\s*\\(${escapeRegex(cleanNote)}\\)\\s*$`);
    const main = title.replace(pattern, "").trim();
    return {
      mainTitle: main || title.trim(),
      subtitle: cleanNote,
    };
  }

  const match = title.match(/^(.*?)\s*\((.*?)\)$/);
  if (match && match[1] && match[2]) {
    return {
      mainTitle: match[1].trim(),
      subtitle: match[2].trim(),
    };
  }

  return {
    mainTitle: title.trim(),
    subtitle: undefined,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
