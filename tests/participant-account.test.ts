import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { createParticipantAccount, participantRow, DEFAULT_PARTICIPANT_PASSWORD } from "@/lib/participant-account";

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf-8");

const mocks = vi.hoisted(() => ({
  createUser: vi.fn(),
  deleteUser: vi.fn(),
  upsert: vi.fn(),
}));

function fakeDb() {
  return {
    auth: { admin: { createUser: mocks.createUser, deleteUser: mocks.deleteUser } },
    from: (table: string) => {
      if (table !== "profiles") throw new Error("tabel tak terduga: " + table);
      return { upsert: mocks.upsert };
    },
  } as never;
}

const fields = { nama: "Abdul Wali", perwakilan_daerah: "BMH Kalimantan Selatan", jabatan: "Kepala Perwakilan" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createUser.mockImplementation(async ({ email }: { email: string }) => ({ data: { user: { id: "uid-" + email } }, error: null }));
  mocks.deleteUser.mockResolvedValue({ error: null });
  mocks.upsert.mockResolvedValue({ error: null });
});

describe("participantRow", () => {
  it("nilai kosong menjadi null, kategori default 'daerah', created_at hanya bila ada", () => {
    expect(participantRow(fields)).toEqual({
      nama: "Abdul Wali",
      perwakilan_daerah: "BMH Kalimantan Selatan",
      jabatan: "Kepala Perwakilan",
      kategori: "daerah",
      ukuran_baju: null,
      legacy_guest_id: null,
    });
    expect(participantRow({ ...fields, created_at: "2026-11-13 09:34:33+00", legacy_guest_id: "g1" })).toMatchObject({
      created_at: "2026-11-13 09:34:33+00",
      legacy_guest_id: "g1",
    });
  });
});

describe("createParticipantAccount", () => {
  it("membuat akun terkonfirmasi dengan email dari nama depan lalu mengisi profil role user", async () => {
    const res = await createParticipantAccount(fakeDb(), { fields, password: "rahasia123" });
    expect(res).toEqual({ ok: true, id: "uid-abdul@bmh.or.id", email: "abdul@bmh.or.id" });
    expect(mocks.createUser).toHaveBeenCalledWith({ email: "abdul@bmh.or.id", password: "rahasia123", email_confirm: true });
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "uid-abdul@bmh.or.id", email: "abdul@bmh.or.id", role: "peserta", nama: "Abdul Wali" }),
      { onConflict: "id" }
    );
  });

  it("memakai email yang diminta bila diberikan", async () => {
    const res = await createParticipantAccount(fakeDb(), { fields, password: "rahasia123", email: "Abdul2@bmh.or.id" });
    expect(res).toMatchObject({ ok: true, email: "abdul2@bmh.or.id" });
  });

  it("email sudah dipakai → mencoba nomor berikutnya", async () => {
    mocks.createUser
      .mockResolvedValueOnce({ data: { user: null }, error: { code: "email_exists", message: "already registered" } })
      .mockResolvedValueOnce({ data: { user: null }, error: { code: "email_exists", message: "already registered" } })
      .mockImplementationOnce(async ({ email }: { email: string }) => ({ data: { user: { id: "u3" } }, error: null, email }));
    const res = await createParticipantAccount(fakeDb(), { fields, password: "rahasia123" });
    expect(res).toMatchObject({ ok: true, id: "u3", email: "abdul3@bmh.or.id" });
    expect(mocks.createUser.mock.calls.map((c) => c[0].email)).toEqual(["abdul@bmh.or.id", "abdul2@bmh.or.id", "abdul3@bmh.or.id"]);
  });

  it("galat Auth lain berhenti tanpa menyentuh profil", async () => {
    mocks.createUser.mockResolvedValueOnce({ data: { user: null }, error: { code: "weak_password", message: "terlalu lemah" } });
    expect(await createParticipantAccount(fakeDb(), { fields, password: "x" })).toMatchObject({ ok: false, code: "email" });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("peserta kembar (indeks unik) → akun baru dibatalkan", async () => {
    mocks.upsert.mockResolvedValueOnce({ error: { code: "23505", message: "duplicate key" } });
    const res = await createParticipantAccount(fakeDb(), { fields, password: "rahasia123" });
    expect(res).toMatchObject({ ok: false, code: "duplicate_person" });
    expect(mocks.deleteUser).toHaveBeenCalledWith("uid-abdul@bmh.or.id");
  });

  it("galat profil lain → akun dibatalkan dan galat dilaporkan", async () => {
    mocks.upsert.mockResolvedValueOnce({ error: { code: "42703", message: "column nama does not exist" } });
    const res = await createParticipantAccount(fakeDb(), { fields, password: "rahasia123" });
    expect(res).toMatchObject({ ok: false, code: "profile" });
    expect(mocks.deleteUser).toHaveBeenCalledTimes(1);
  });
});

describe("migrasi 0010 & 0011 dan pemasangan di aplikasi", () => {
  const m10 = read("supabase", "migrations", "0010_profiles_participant_columns.sql").replace(/--.*$/gm, "");
  const m11 = read("supabase", "migrations", "0011_drop_guests.sql").replace(/--.*$/gm, "");

  it("0010: kolom peserta, indeks unik, dan akses anon hanya per kolom (tanpa email/role)", () => {
    for (const col of ["nama", "perwakilan_daerah", "jabatan", "departemen", "kategori", "ukuran_baju", "mode_kehadiran", "legacy_guest_id"]) {
      expect(m10).toContain(`add column if not exists ${col}`);
    }
    expect(m10).toMatch(/create unique index if not exists profiles_unique_participant/);
    const grant = m10.match(/grant select \(([^)]+)\)\s+on public\.profiles to anon, authenticated/);
    expect(grant).not.toBeNull();
    expect(grant![1]).not.toMatch(/email|role/);
    expect(m10).toMatch(/revoke select on public\.profiles from authenticated/);
    expect(m10).toMatch(/create policy "Public can read participants" on public\.profiles\s+for select to anon, authenticated using \(nama is not null\)/);
  });

  it("0011: menolak berjalan bila ada guests belum dipindahkan, menyambung ulang riwayat, lalu drop", () => {
    expect(m11).toContain("legacy_guest_id = g.id");
    expect(m11).toMatch(/raise exception 'Masih ada %/);
    expect(m11).toMatch(/update public\.attendances a\s+set guest_id = p\.id/);
    expect(m11).toMatch(/update public\.registrations r\s+set guest_id = p\.id/);
    expect(m11).toMatch(/foreign key \(guest_id\) references public\.profiles \(id\) on delete set null/g);
    expect(m11).toContain("drop function if exists public.approve_registration(uuid)");
    expect(m11.indexOf("update public.attendances a")).toBeLessThan(m11.indexOf("drop table public.guests"));
  });

  it("kode tidak lagi membaca tabel guests atau memanggil approve_registration", () => {
    const files = [
      ["app", "admin", "actions.ts"],
      ["app", "absen", "actions.ts"],
      ["app", "absen", "page.tsx"],
      ["app", "display", "page.tsx"],
      ["app", "api", "guests", "search", "route.ts"],
      ["lib", "display-anatomy-data.ts"],
      ["components", "display", "attendance-board.tsx"],
    ];
    for (const f of files) {
      const src = read(...f);
      expect(src, f.join("/")).not.toMatch(/\.from\("guests"\)/);
      expect(src, f.join("/")).not.toContain("approve_registration");
    }
  });

  it("daftar peserta selalu dibatasi pada profil yang punya nama (akun admin tidak ikut)", () => {
    for (const f of [
      ["app", "absen", "page.tsx"],
      ["app", "display", "page.tsx"],
      ["app", "api", "guests", "search", "route.ts"],
      ["components", "display", "attendance-board.tsx"],
    ]) {
      expect(read(...f), f.join("/")).toContain('.not("nama", "is", null)');
    }
  });

  it("password default sesuai permintaan dan dapat diganti lewat env", () => {
    expect(DEFAULT_PARTICIPANT_PASSWORD).toBe("rakernas2027");
    expect(read(".env.local.example")).toContain("PARTICIPANT_DEFAULT_PASSWORD");
  });
});
