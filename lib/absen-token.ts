import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Pengaman alur absen:
 * - Token QR berputar: QR di layar lokasi berganti tiap QR_WINDOW_MS, link yang dibagikan cepat kedaluwarsa.
 * - Tiket scan: cookie httpOnly sekali pakai yang didapat setelah scan QR valid.
 * - ID perangkat: cookie acak per HP, disimpan di DB dalam bentuk hash agar tidak bisa disalahgunakan.
 */

export const QR_WINDOW_MS = 30_000;
export const TICKET_TTL_MS = 5 * 60_000;
export const DEVICE_TTL_SECONDS = 60 * 60 * 24 * 30;

export const TICKET_COOKIE = "absen_ticket";
export const DEVICE_COOKIE = "absen_device";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSecret(): string {
  const secret = process.env.ABSEN_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ABSEN_TOKEN_SECRET belum diatur (minimal 16 karakter)");
  }
  return secret;
}

function sign(purpose: string, payload: string): string {
  return createHmac("sha256", getSecret()).update(`${purpose}:${payload}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

// ---------- Token QR berputar ----------

export function currentQrWindow(now = Date.now()): number {
  return Math.floor(now / QR_WINDOW_MS);
}

export function createQrToken(now = Date.now()): { token: string; expiresAt: number } {
  const window = currentQrWindow(now);
  return {
    token: `${window}.${sign("qr", String(window))}`,
    // Diterima sampai akhir window berikutnya (lihat verifyQrToken)
    expiresAt: (window + 2) * QR_WINDOW_MS,
  };
}

/** Menerima token window sekarang dan satu window sebelumnya (masa berlaku 30–60 detik). */
export function verifyQrToken(token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [windowStr, sig, ...rest] = token.split(".");
  if (rest.length > 0 || !windowStr || !sig || !/^\d+$/.test(windowStr)) return false;
  const window = Number(windowStr);
  const current = currentQrWindow(now);
  if (window !== current && window !== current - 1) return false;
  return safeEqual(sig, sign("qr", windowStr));
}

// ---------- Tiket scan sekali pakai ----------

export interface ScanTicket {
  nonce: string;
  expiresAt: number;
}

export function createTicket(now = Date.now()): { value: string; ticket: ScanTicket } {
  const nonce = randomUUID();
  const expiresAt = now + TICKET_TTL_MS;
  const payload = `${nonce}.${expiresAt}`;
  return { value: `${payload}.${sign("ticket", payload)}`, ticket: { nonce, expiresAt } };
}

export function verifyTicket(value: string | null | undefined, now = Date.now()): ScanTicket | null {
  if (!value) return null;
  const [nonce, expStr, sig, ...rest] = value.split(".");
  if (rest.length > 0 || !nonce || !expStr || !sig) return null;
  if (!UUID_RE.test(nonce) || !/^\d+$/.test(expStr)) return null;
  if (!safeEqual(sig, sign("ticket", `${nonce}.${expStr}`))) return null;
  const expiresAt = Number(expStr);
  if (now > expiresAt) return null;
  return { nonce, expiresAt };
}

// ---------- ID perangkat ----------

export function createDeviceId(): string {
  return randomUUID();
}

export function isValidDeviceId(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value);
}

/** Hash ID perangkat sebelum disimpan (tabel attendances bisa dibaca publik). */
export function hashDeviceId(deviceId: string): string {
  return sign("device", deviceId);
}

export function cookieBaseOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}
