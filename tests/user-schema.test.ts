import { describe, it, expect } from "vitest";
import {
  createUserSchema,
  emailSchema,
  generatePassword,
  passwordSchema,
  roleSchema,
  updateUserSchema,
  userIdSchema,
} from "@/lib/user-schema";
import { isBanned, formatUserDate } from "@/lib/user-row";

describe("skema pengguna", () => {
  it("email dinormalkan (trim + huruf kecil) dan divalidasi", () => {
    expect(emailSchema.parse("  Panitia@BMH.or.id ")).toBe("panitia@bmh.or.id");
    for (const bad of ["", "tanpa-at", "a@", "@b.com", "a b@c.com"]) {
      expect(emailSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("kata sandi 8-72 karakter", () => {
    expect(passwordSchema.safeParse("1234567").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(72)).success).toBe(true);
    expect(passwordSchema.safeParse("x".repeat(73)).success).toBe(false);
  });

  it("peran hanya admin, peserta, atau user", () => {
    expect(roleSchema.safeParse("admin").success).toBe(true);
    expect(roleSchema.safeParse("peserta").success).toBe(true);
    expect(roleSchema.safeParse("user").success).toBe(true);
    expect(roleSchema.safeParse("superadmin").success).toBe(false);
    expect(roleSchema.safeParse("").success).toBe(false);
  });

  it("createUserSchema mewajibkan email, kata sandi, dan peran", () => {
    expect(createUserSchema.parse({ email: "A@b.co", password: "rahasia123", role: "admin" })).toEqual({
      email: "a@b.co",
      password: "rahasia123",
      role: "admin",
    });
    expect(createUserSchema.safeParse({ email: "a@b.co", password: "rahasia123" }).success).toBe(false);
  });

  it("updateUserSchema menolak perubahan kosong dan mengizinkan sebagian bidang", () => {
    expect(updateUserSchema.safeParse({}).success).toBe(false);
    expect(updateUserSchema.safeParse({ role: "user" }).success).toBe(true);
    expect(updateUserSchema.safeParse({ password: "pendek" }).success).toBe(false);
  });

  it("ID pengguna harus UUID", () => {
    expect(userIdSchema.safeParse("a14ef8fd-3f79-49ea-a11a-0fc919b23c92").success).toBe(true);
    expect(userIdSchema.safeParse("1; drop table").success).toBe(false);
  });

  it("generatePassword menghasilkan kata sandi acak yang lolos validasi", () => {
    const a = generatePassword();
    const b = generatePassword();
    expect(a).toHaveLength(14);
    expect(a).not.toBe(b);
    expect(a).not.toMatch(/[01OIl]/);
    expect(passwordSchema.safeParse(a).success).toBe(true);
    expect(generatePassword(20)).toHaveLength(20);
  });
});

describe("pembantu baris pengguna", () => {
  it("isBanned: hanya true bila banned_until di masa depan", () => {
    const now = Date.parse("2026-11-20T00:00:00Z");
    expect(isBanned(null, now)).toBe(false);
    expect(isBanned(undefined, now)).toBe(false);
    expect(isBanned("2026-01-01T00:00:00Z", now)).toBe(false);
    expect(isBanned("2126-01-01T00:00:00Z", now)).toBe(true);
    expect(isBanned("bukan-tanggal", now)).toBe(false);
  });

  it("formatUserDate: 'Belum pernah' bila kosong", () => {
    expect(formatUserDate(null)).toBe("Belum pernah");
    expect(formatUserDate("2026-12-08T03:00:00Z")).toContain("2026");
  });
});
