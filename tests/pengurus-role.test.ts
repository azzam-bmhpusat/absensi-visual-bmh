import { describe, expect, it } from "vitest";
import { hasSiteWideAccess, ROLE_LABEL, roleSchema, toUserRole, USER_ROLES } from "@/lib/user-schema";
import { ALL_JABATAN, filterUsers } from "@/lib/user-row";

describe("role pengurus", () => {
  it("dikenali sebagai role valid berlabel Pengurus", () => {
    expect(USER_ROLES).toContain("pengurus");
    expect(toUserRole("pengurus")).toBe("pengurus");
    expect(roleSchema.parse("pengurus")).toBe("pengurus");
    expect(ROLE_LABEL.pengurus).toBe("Pengurus");
  });

  it("punya akses situs yang sama dengan direktur, bukan peserta/user/admin", () => {
    expect(hasSiteWideAccess("pengurus")).toBe(true);
    expect(hasSiteWideAccess("direktur")).toBe(true);
    expect(hasSiteWideAccess("peserta")).toBe(false);
    expect(hasSiteWideAccess("user")).toBe(false);
    expect(hasSiteWideAccess("admin")).toBe(false);
  });

  it("bisa difilter di manajemen user", () => {
    const users = (["pengurus", "direktur", "peserta"] as const).map((role, i) => ({
      email: `u${i}@bmh.or.id`,
      role,
      banned: false,
      profile: {},
    }));
    const result = filterUsers(users as never, { status: "pengurus", jabatan: ALL_JABATAN, q: "" });
    expect(result.map((u: { role: string }) => u.role)).toEqual(["pengurus"]);
  });
});
