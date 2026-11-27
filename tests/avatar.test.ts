import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVATAR_MAX_BYTES, avatarFileError, avatarObjectPath, avatarPublicUrl } from "@/lib/avatar";

const USER_ID = "55555555-5555-4555-8555-555555555555";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  from: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: (bucket: string) => {
        mocks.from(bucket);
        return { upload: mocks.upload, remove: mocks.remove };
      },
    },
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath, updateTag: mocks.updateTag }));

import { removeAvatar, uploadAvatar } from "@/app/(site)/profile/actions";

const user = { id: USER_ID, app_metadata: {} };

function avatarForm(file: File) {
  const fd = new FormData();
  fd.set("avatar", file);
  return fd;
}

describe("avatarPublicUrl", () => {
  it("merakit URL publik dari path + versi", () => {
    expect(avatarPublicUrl(`${USER_ID}/avatar?v=1`, "https://x.supabase.co/")).toBe(
      `https://x.supabase.co/storage/v1/object/public/avatars/${USER_ID}/avatar?v=1`
    );
  });

  it("null bila kosong; URL absolut dibiarkan", () => {
    expect(avatarPublicUrl(null, "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl("  ", "https://x.supabase.co")).toBeNull();
    expect(avatarPublicUrl("https://cdn/a.png", "https://x.supabase.co")).toBe("https://cdn/a.png");
  });

  it("path objek per akun", () => {
    expect(avatarObjectPath(USER_ID)).toBe(`${USER_ID}/avatar`);
  });
});

describe("avatarFileError", () => {
  it("menolak non-gambar, kosong, dan > 1 MB", () => {
    expect(avatarFileError(null)).toMatch(/Pilih foto/);
    expect(avatarFileError(new File([], "a.png", { type: "image/png" }))).toMatch(/Pilih foto/);
    expect(avatarFileError(new File(["x"], "a.gif", { type: "image/gif" }))).toMatch(/Format/);
    expect(avatarFileError(new File([new Uint8Array(AVATAR_MAX_BYTES + 1)], "a.png", { type: "image/png" }))).toMatch(/1 MB/);
    expect(avatarFileError(new File(["x"], "a.webp", { type: "image/webp" }))).toBeNull();
  });
});

describe("uploadAvatar / removeAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user } });
    mocks.upload.mockResolvedValue({ error: null });
    mocks.remove.mockResolvedValue({ error: null });
  });

  it("mengunggah ke avatars/{id}/avatar dengan upsert", async () => {
    const file = new File(["img"], "a.webp", { type: "image/webp" });
    const res = await uploadAvatar(avatarForm(file));
    expect(res.success).toBe(true);
    expect(mocks.from).toHaveBeenCalledWith("avatars");
    expect(mocks.upload).toHaveBeenCalledWith(`${USER_ID}/avatar`, expect.any(File), expect.objectContaining({ upsert: true, contentType: "image/webp" }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mocks.updateTag).toHaveBeenCalledWith("content-hotel");
  });

  it("menolak tanpa sesi dan file tidak valid tanpa menyentuh storage", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });
    expect((await uploadAvatar(avatarForm(new File(["x"], "a.png", { type: "image/png" })))).success).toBe(false);
    expect((await uploadAvatar(avatarForm(new File(["x"], "a.gif", { type: "image/gif" })))).error).toMatch(/Format/);
    expect(mocks.upload).not.toHaveBeenCalled();
  });

  it("menghapus objek milik akun sendiri", async () => {
    const res = await removeAvatar();
    expect(res.success).toBe(true);
    expect(mocks.remove).toHaveBeenCalledWith([`${USER_ID}/avatar`]);
    expect(mocks.updateTag).toHaveBeenCalledWith("content-hotel");
  });

  it("meneruskan galat storage", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "quota" } });
    const res = await uploadAvatar(avatarForm(new File(["x"], "a.png", { type: "image/png" })));
    expect(res.error).toMatch(/quota/);
  });
});
