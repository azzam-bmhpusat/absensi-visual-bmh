import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { GET } from "@/app/absen/scan/route";
import { DEVICE_COOKIE, TICKET_COOKIE, createQrToken, verifyTicket } from "@/lib/absen-token";

beforeAll(() => {
  process.env.ABSEN_TOKEN_SECRET = "test-secret-yang-cukup-panjang";
});

describe("GET /absen/scan", () => {
  it("token valid → set tiket + device cookie httpOnly dan redirect ke /absen tanpa token", async () => {
    const { token } = createQrToken();
    const res = await GET(new NextRequest(`https://contoh.test/absen/scan?t=${token}`));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://contoh.test/absen");

    const ticket = res.cookies.get(TICKET_COOKIE);
    const device = res.cookies.get(DEVICE_COOKIE);
    expect(ticket?.httpOnly).toBe(true);
    expect(verifyTicket(ticket?.value)).not.toBeNull();
    expect(device?.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("mempertahankan ID perangkat yang sudah ada", async () => {
    const existing = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
    const req = new NextRequest(`https://contoh.test/absen/scan?t=${createQrToken().token}`, {
      headers: { cookie: `${DEVICE_COOKIE}=${existing}` },
    });
    const res = await GET(req);
    expect(res.cookies.get(DEVICE_COOKIE)?.value).toBe(existing);
  });

  it("token kedaluwarsa/palsu → redirect /absen?e=qr tanpa tiket", async () => {
    const old = createQrToken(Date.now() - 5 * 60_000).token;
    for (const t of [old, "123.palsu", ""]) {
      const res = await GET(new NextRequest(`https://contoh.test/absen/scan?t=${t}`));
      expect(res.headers.get("location")).toBe("https://contoh.test/absen?e=qr");
      expect(res.cookies.get(TICKET_COOKIE)).toBeUndefined();
    }
  });
});
