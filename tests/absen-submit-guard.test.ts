import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  cookieValues: new Map<string, string>(),
  insert: vi.fn(),
  insertResult: { data: { id: "att-1" }, error: null } as { data: unknown; error: unknown },
  from: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": `10.0.0.${Math.floor(Math.random() * 250)}` }),
  cookies: async () => ({
    get: (name: string) => (mocks.cookieValues.has(name) ? { name, value: mocks.cookieValues.get(name)! } : undefined),
  }),
}));

vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => true }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mocks.from }),
}));

import { submitAttendance } from "@/app/absen/actions";
import { DEVICE_COOKIE, TICKET_COOKIE, createTicket, hashDeviceId } from "@/lib/absen-token";

const DEVICE = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
const input = { sessionId: 1, guestId: "", nama: "Ahmad Fauzi", perwakilanDaerah: "Jawa Timur", website: "" };

function table(name: string) {
  const b: Record<string, unknown> = {};
  b.select = () => b;
  b.eq = () => b;
  b.not = () => b;
  b.maybeSingle = async () =>
    name === "sessions" ? { data: { id: 1, nama: "Absen Masuk Pagi", is_active: true } } : mocks.insertResult;
  b.then = (resolve: (v: unknown) => unknown) => resolve({ data: [] }); // daftar peserta (profiles)
  b.insert = (row: unknown) => {
    mocks.insert(row);
    return b;
  };
  return b;
}

beforeAll(() => {
  process.env.ABSEN_TOKEN_SECRET = "test-secret-yang-cukup-panjang";
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieValues.clear();
  mocks.insertResult = { data: { id: "att-1" }, error: null };
  mocks.from.mockImplementation((name: string) => table(name));
});

describe("submitAttendance — pengaman scan QR", () => {
  it("tanpa tiket scan → ditolak sebelum menyentuh database (link dibagikan)", async () => {
    mocks.cookieValues.set(DEVICE_COOKIE, DEVICE);
    const res = await submitAttendance(input);
    expect(res).toMatchObject({ status: "error", message: expect.stringContaining("scan ulang") });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("tiket kedaluwarsa atau tanpa ID perangkat → ditolak", async () => {
    mocks.cookieValues.set(TICKET_COOKIE, createTicket(Date.now() - 10 * 60_000).value);
    mocks.cookieValues.set(DEVICE_COOKIE, DEVICE);
    expect((await submitAttendance(input)).status).toBe("error");

    mocks.cookieValues.set(TICKET_COOKIE, createTicket().value);
    mocks.cookieValues.delete(DEVICE_COOKIE);
    expect((await submitAttendance(input)).status).toBe("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("tiket valid → insert membawa nonce tiket dan hash perangkat", async () => {
    const { value, ticket } = createTicket();
    mocks.cookieValues.set(TICKET_COOKIE, value);
    mocks.cookieValues.set(DEVICE_COOKIE, DEVICE);

    const res = await submitAttendance(input);
    expect(res).toMatchObject({ status: "ok", nama: "Ahmad Fauzi" });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ ticket_nonce: ticket.nonce, device_hash: hashDeviceId(DEVICE) })
    );
  });

  it("tiket yang sama dipakai lagi (unique ticket) → minta scan ulang", async () => {
    mocks.cookieValues.set(TICKET_COOKIE, createTicket().value);
    mocks.cookieValues.set(DEVICE_COOKIE, DEVICE);
    mocks.insertResult = {
      data: null,
      error: { code: "23505", message: 'duplicate key value violates unique constraint "attendances_unique_ticket"' },
    };
    expect(await submitAttendance(input)).toMatchObject({ status: "error", message: expect.stringContaining("scan ulang") });
  });

  it("HP yang sama untuk orang lain di sesi yang sama (unique device) → ditolak", async () => {
    mocks.cookieValues.set(TICKET_COOKIE, createTicket().value);
    mocks.cookieValues.set(DEVICE_COOKIE, DEVICE);
    mocks.insertResult = {
      data: null,
      error: { code: "23505", message: 'duplicate key value violates unique constraint "attendances_unique_device"' },
    };
    expect(await submitAttendance({ ...input, nama: "Teman Ahmad" })).toMatchObject({
      status: "already",
      message: expect.stringContaining("HP ini sudah dipakai"),
    });
  });
});
