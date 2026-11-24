import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FOOTER_DATA } from "@/content/rakernas";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  role: "user" as string | null,
  update: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: mocks.role ? { role: mocks.role } : null, error: null }) }),
      }),
      update: (fields: unknown) => {
        mocks.update(fields);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateProfile } from "@/app/(site)/profile/actions";

/** Isian profil lengkap yang valid (lolos selfProfileSchema). */
function validForm() {
  const data = new FormData();
  data.set("nama", "Budi Santoso");
  data.set("perwakilan_daerah", "Jawa Timur");
  data.set("ukuran_baju", "L");
  data.set("no_whatsapp", "081234567890");
  data.set("rencana_kedatangan", "2026-12-07T10:00");
  data.set("keterangan_kehadiran", "offline");
  return data;
}

const read = (file: string) => fs.readFileSync(path.join(__dirname, "..", file), "utf-8");

describe("role user tidak bisa mengisi profil peserta", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  });

  it("updateProfile menolak role user tanpa mengubah data", async () => {
    mocks.role = "user";
    const res = await updateProfile(null, validForm());
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/belum terdaftar sebagai peserta/);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("peserta tetap bisa menyimpan profil", async () => {
    mocks.role = "peserta";
    const res = await updateProfile(null, validForm());
    expect(res).toMatchObject({ success: true });
    expect(mocks.update).toHaveBeenCalledOnce();
  });
});

describe("tampilan untuk role user", () => {
  it("/profile menampilkan ajakan menghubungi panitia, bukan form", () => {
    const page = read("app/(site)/profile/page.tsx");
    expect(page).toMatch(/isApplicant \? \(\s*<ApplyParticipantCard \/>/);
    expect(page).toContain("FOOTER_DATA.committee");
    expect(page).toContain("untuk menjadi peserta");
    expect(FOOTER_DATA.committee.phone).toBe("089517795206");
    expect(FOOTER_DATA.committee.url).toBe("https://wa.me/6289517795206");
  });

  it("ProfileGate memakai dialog 'ajukan peserta' untuk role user", () => {
    const gate = read("components/rakernas/profile-gate.tsx");
    expect(gate).toContain('=== "user") return <CompleteProfileDialog variant="apply" />');
    const dialog = read("components/rakernas/complete-profile-dialog.tsx");
    expect(dialog).toContain("Silakan ajukan diri Anda sebagai peserta di halaman profil.");
    // Teks lama tetap untuk peserta yang profilnya belum lengkap.
    expect(dialog).toContain("Lengkapi Profil Anda");
  });
});
