import { NextResponse, type NextRequest } from "next/server";
import {
  DEVICE_COOKIE,
  DEVICE_TTL_SECONDS,
  TICKET_COOKIE,
  TICKET_TTL_MS,
  cookieBaseOptions,
  createDeviceId,
  createTicket,
  isValidDeviceId,
  verifyQrToken,
} from "@/lib/absen-token";

/**
 * Titik masuk dari QR dinamis: /absen/scan?t=<token>.
 * Token valid → beri tiket sekali pakai (cookie httpOnly) lalu alihkan ke /absen
 * sehingga URL di address bar tidak lagi membawa token yang bisa dibagikan.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const target = request.nextUrl.clone();
  target.search = "";

  if (!verifyQrToken(token)) {
    target.pathname = "/absen";
    target.searchParams.set("e", "qr");
    const res = NextResponse.redirect(target, 303);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  target.pathname = "/absen";
  const res = NextResponse.redirect(target, 303);
  res.headers.set("Cache-Control", "no-store");

  const { value } = createTicket();
  res.cookies.set(TICKET_COOKIE, value, {
    ...cookieBaseOptions(),
    maxAge: Math.floor(TICKET_TTL_MS / 1000),
  });

  const existingDevice = request.cookies.get(DEVICE_COOKIE)?.value;
  res.cookies.set(DEVICE_COOKIE, isValidDeviceId(existingDevice) ? existingDevice : createDeviceId(), {
    ...cookieBaseOptions(),
    maxAge: DEVICE_TTL_SECONDS,
  });

  return res;
}
