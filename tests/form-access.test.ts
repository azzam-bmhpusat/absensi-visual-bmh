import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  cookieValues: new Map<string, string>(),
  setCookie: vi.fn(),
  update: vi.fn(),
  updateResult: { data: { email: "budi@bmh.or.id" }, error: null } as { data: unknown; error: unknown },
  /** Profil saat ini (dibaca sebelum update); default belum lengkap. */
  currentRow: { nama: "Budi", perwakilan_daerah: "BMH Jawa Timur" } as Record<string, string> | null,
  ip: "10.0.0.1",
}));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": mocks.ip }),
  cookies: async () => ({
    get: (name: string) => (mocks.cookieValues.has(name) ? { name, value: mocks.cookieValues.get(name)! } : undefined),
    set: mocks.setCookie,
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => {
      let isUpdate = false;
      const b: Record<string, unknown> = {};
      b.update = (row: unknown) => {
        isUpdate = true;
        mocks.update(row);
        return b;
      };
      b.eq = () => b;
      b.select = () => b;
      b.maybeSingle = async () => (isUpdate ? mocks.updateResult : { data: mocks.currentRow, error: null });
      return b;
    },
  }),
}));

import {
  FORM_ACCESS_COOKIE,
  FORM_ACCESS_TTL_MS,
  createFormAccessToken,
  isFormAccessPassword,
  verifyFormAccessToken,
} from "@/lib/form-access";
import { loadParticipant, submitParticipantForm, unlockForm } from "@/app/(site)/form/actions";

const ID = "3f2b8c1e-4a5d-4e6f-8a9b-0c1d2e3f4a5b";
const VALID = {
  id: ID,
  nama: "Budi Santoso",
  perwakilan_daerah: "Jawa Timur",
  jabatan: "Kepala Cabang",
  ukuran_baju: "L",
  no_whatsapp: "0812-3456-7890",
  rencana_kedatangan: "2026-11-27T14:00",
  keterangan_kehadiran: "offline",
};

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

let ipSeq = 0;

beforeAll(() => {
  process.env.ABSEN_TOKEN_SECRET = "test-secret-1234567890";
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieValues.clear();
  mocks.updateResult = { data: { email: "budi@bmh.or.id" }, error: null };
  mocks.currentRow = { nama: "Budi", perwakilan_daerah: "BMH Jawa Timur" };
  ipSeq += 1;
  mocks.ip = `10.0.1.${ipSeq}`;
});

describe("kata sandi & token akses /form", () => {
  it("menerima RAKERNAS2027 tanpa peduli huruf besar/kecil", () => {
    expect(isFormAccessPassword("RAKERNAS2027")).toBe(true);
    expect(isFormAccessPassword(" rakernas2027 ")).toBe(true);
    expect(isFormAccessPassword("RAKERNAS2026")).toBe(false);
    expect(isFormAccessPassword("")).toBe(false);
  });

  it("token berlaku sampai kedaluwarsa dan tidak bisa dipalsukan", () => {
    const now = 1_000_000;
    const token = createFormAccessToken(now);
    expect(verifyFormAccessToken(token, now + 1000)).toBe(true);
    expect(verifyFormAccessToken(token, now + FORM_ACCESS_TTL_MS + 1)).toBe(false);
    const [exp] = token.split(".");
    expect(verifyFormAccessToken(`${Number(exp) + 999999}.${token.split(".")[1]}`, now)).toBe(false);
    expect(verifyFormAccessToken("abc", now)).toBe(false);
    expect(verifyFormAccessToken(undefined, now)).toBe(false);
  });
});

describe("unlockForm", () => {
  it("kata sandi salah: tidak memberi cookie", async () => {
    expect(await unlockForm(null, form({ password: "SALAH" }))).toMatchObject({ success: false });
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it("kata sandi benar: memberi cookie akses httpOnly", async () => {
    expect(await unlockForm(null, form({ password: "rakernas2027" }))).toEqual({ success: true });
    const [name, value, options] = mocks.setCookie.mock.calls[0];
    expect(name).toBe(FORM_ACCESS_COOKIE);
    expect(verifyFormAccessToken(value)).toBe(true);
    expect(options).toMatchObject({ httpOnly: true });
  });

  it("membatasi percobaan per IP (10 per 15 menit)", async () => {
    for (let i = 0; i < 10; i += 1) await unlockForm(null, form({ password: "SALAH" }));
    expect((await unlockForm(null, form({ password: "RAKERNAS2027" }))).error).toMatch(/Terlalu banyak/);
  });
});

describe("submitParticipantForm", () => {
  it("ditolak tanpa cookie akses", async () => {
    expect((await submitParticipantForm(null, form(VALID))).success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("ditolak bila ada field wajib kosong (termasuk jabatan)", async () => {
    mocks.cookieValues.set(FORM_ACCESS_COOKIE, createFormAccessToken());
    for (const field of ["jabatan", "no_whatsapp", "rencana_kedatangan", "ukuran_baju", "keterangan_kehadiran"]) {
      const res = await submitParticipantForm(null, form({ ...VALID, [field]: "" }));
      expect(res.success, field).toBe(false);
    }
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("menyimpan data lalu mengembalikan email akun peserta", async () => {
    mocks.cookieValues.set(FORM_ACCESS_COOKIE, createFormAccessToken());
    expect(await submitParticipantForm(null, form(VALID))).toEqual({ success: true, email: "budi@bmh.or.id" });
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({ jabatan: "Kepala Cabang", no_whatsapp: "081234567890" })
    );
  });

  it("nama dan email dikunci: nilai dari browser diabaikan", async () => {
    mocks.cookieValues.set(FORM_ACCESS_COOKIE, createFormAccessToken());
    await submitParticipantForm(null, form({ ...VALID, nama: "Nama Palsu", email: "lain@bmh.or.id" }));
    const row = mocks.update.mock.calls[0][0] as Record<string, unknown>;
    expect(row).not.toHaveProperty("nama");
    expect(row).not.toHaveProperty("email");
  });

  it("profil yang sudah lengkap tidak bisa diisi ulang lewat /form", async () => {
    mocks.cookieValues.set(FORM_ACCESS_COOKIE, createFormAccessToken());
    mocks.currentRow = {
      nama: "Budi",
      perwakilan_daerah: "BMH Jawa Timur",
      jabatan: "Kepala",
      ukuran_baju: "L",
      no_whatsapp: "081234567890",
      rencana_kedatangan: "2026-12-08T03:00:00.000Z",
      keterangan_kehadiran: "offline",
    };
    expect((await submitParticipantForm(null, form(VALID))).error).toMatch(/sudah diisi lengkap/);
    expect((await loadParticipant(ID)).success).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("peserta tidak ditemukan (id bukan peserta) ditolak", async () => {
    mocks.cookieValues.set(FORM_ACCESS_COOKIE, createFormAccessToken());
    mocks.updateResult = { data: null, error: null };
    expect((await submitParticipantForm(null, form(VALID))).error).toMatch(/tidak ditemukan/);
  });
});
