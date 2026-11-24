import "server-only";
import { cookieBaseOptions, safeEqual, sign } from "./absen-token";

/** Kata sandi akses bersama untuk halaman publik /form (dibandingkan dalam huruf besar). */
export const FORM_ACCESS_PASSWORD = "RAKERNAS2027";
export const FORM_ACCESS_COOKIE = "form_access";
export const FORM_ACCESS_TTL_MS = 12 * 60 * 60_000;

export function isFormAccessPassword(input: string): boolean {
  return safeEqual(input.trim().toUpperCase(), FORM_ACCESS_PASSWORD);
}

/** Nilai cookie: `<kedaluwarsa>.<hmac>` agar tidak bisa dipalsukan tanpa ABSEN_TOKEN_SECRET. */
export function createFormAccessToken(now = Date.now()): string {
  const expiresAt = String(now + FORM_ACCESS_TTL_MS);
  return `${expiresAt}.${sign("form-access", expiresAt)}`;
}

export function verifyFormAccessToken(value: string | null | undefined, now = Date.now()): boolean {
  if (!value) return false;
  const [expStr, sig, ...rest] = value.split(".");
  if (rest.length > 0 || !expStr || !sig || !/^\d+$/.test(expStr)) return false;
  if (now > Number(expStr)) return false;
  return safeEqual(sig, sign("form-access", expStr));
}

export function formAccessCookieOptions() {
  return { ...cookieBaseOptions(), maxAge: FORM_ACCESS_TTL_MS / 1000 };
}
