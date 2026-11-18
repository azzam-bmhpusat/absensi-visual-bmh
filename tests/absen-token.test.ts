import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  QR_WINDOW_MS,
  TICKET_TTL_MS,
  createQrToken,
  createTicket,
  hashDeviceId,
  isValidDeviceId,
  verifyQrToken,
  verifyTicket,
} from "@/lib/absen-token";

beforeAll(() => {
  process.env.ABSEN_TOKEN_SECRET = "test-secret-yang-cukup-panjang";
});

describe("token QR berputar", () => {
  const t0 = 1_800_000_000_000;

  it("menerima token window sekarang dan satu window sebelumnya", () => {
    const { token } = createQrToken(t0);
    expect(verifyQrToken(token, t0)).toBe(true);
    expect(verifyQrToken(token, t0 + QR_WINDOW_MS)).toBe(true);
  });

  it("menolak token yang sudah lewat dua window (link yang dibagikan)", () => {
    const { token } = createQrToken(t0);
    expect(verifyQrToken(token, t0 + 2 * QR_WINDOW_MS)).toBe(false);
  });

  it("menolak token dari masa depan, ditempa, atau kosong", () => {
    const { token } = createQrToken(t0 + 5 * QR_WINDOW_MS);
    expect(verifyQrToken(token, t0)).toBe(false);
    const [w] = createQrToken(t0).token.split(".");
    expect(verifyQrToken(`${w}.palsu`, t0)).toBe(false);
    expect(verifyQrToken(`${Number(w) + 1}.${createQrToken(t0).token.split(".")[1]}`, t0)).toBe(false);
    expect(verifyQrToken(null, t0)).toBe(false);
    expect(verifyQrToken("abc", t0)).toBe(false);
  });

  it("menolak token yang ditandatangani dengan secret lain", () => {
    const { token } = createQrToken(t0);
    process.env.ABSEN_TOKEN_SECRET = "secret-lain-yang-juga-panjang";
    expect(verifyQrToken(token, t0)).toBe(false);
    process.env.ABSEN_TOKEN_SECRET = "test-secret-yang-cukup-panjang";
  });
});

describe("tiket scan", () => {
  const t0 = 1_800_000_000_000;

  it("tiket valid sampai masa berlaku habis", () => {
    const { value, ticket } = createTicket(t0);
    expect(verifyTicket(value, t0 + 1000)).toEqual(ticket);
    expect(verifyTicket(value, t0 + TICKET_TTL_MS + 1)).toBeNull();
  });

  it("menolak tiket yang diubah (misal memperpanjang masa berlaku)", () => {
    const { value } = createTicket(t0);
    const [nonce, exp, sig] = value.split(".");
    expect(verifyTicket(`${nonce}.${Number(exp) + 999_999}.${sig}`, t0)).toBeNull();
    expect(verifyTicket(`00000000-0000-4000-8000-000000000000.${exp}.${sig}`, t0)).toBeNull();
    expect(verifyTicket(undefined, t0)).toBeNull();
  });
});

describe("ID perangkat", () => {
  it("memvalidasi format UUID dan menghasilkan hash stabil yang bukan ID aslinya", () => {
    const id = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
    expect(isValidDeviceId(id)).toBe(true);
    expect(isValidDeviceId("bukan-uuid")).toBe(false);
    expect(hashDeviceId(id)).toBe(hashDeviceId(id));
    expect(hashDeviceId(id)).not.toContain(id);
  });
});
