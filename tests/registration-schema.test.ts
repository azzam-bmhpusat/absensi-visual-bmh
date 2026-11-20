import { describe, it, expect } from "vitest";
import { registrationSchema } from "../lib/registration-schema";

const valid = {
  nama: "  Ahmad   Dahlan ",
  perwakilan_bmh: "BMH Jawa Timur",
  jabatan: "Kepala Perwakilan",
  departemen: "",
  ukuran_baju: "L",
  mode_kehadiran: "offline",
};

describe("registrationSchema", () => {
  it("menerima data valid, menormalisasi spasi, dan departemen kosong jadi undefined", () => {
    const r = registrationSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.nama).toBe("Ahmad Dahlan");
      expect(r.data.departemen).toBeUndefined();
    }
  });

  it("menerima departemen terisi", () => {
    const r = registrationSchema.safeParse({ ...valid, departemen: " IT " });
    expect(r.success && r.data.departemen).toBe("IT");
  });

  it("menolak nama kosong / terlalu pendek / terlalu panjang", () => {
    expect(registrationSchema.safeParse({ ...valid, nama: "" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, nama: "Al" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, nama: "a".repeat(101) }).success).toBe(false);
  });

  it("menolak jabatan dan perwakilan kosong", () => {
    expect(registrationSchema.safeParse({ ...valid, jabatan: "   " }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, perwakilan_bmh: "" }).success).toBe(false);
  });

  it("menolak ukuran baju dan mode kehadiran di luar pilihan", () => {
    expect(registrationSchema.safeParse({ ...valid, ukuran_baju: "XS" }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, ukuran_baju: undefined }).success).toBe(false);
    expect(registrationSchema.safeParse({ ...valid, mode_kehadiran: "hybrid" }).success).toBe(false);
  });

  it("menerima semua ukuran dan mode yang valid", () => {
    for (const ukuran of ["S", "M", "L", "XL", "XXL", "3XL"]) {
      for (const mode of ["offline", "online"]) {
        expect(
          registrationSchema.safeParse({ ...valid, ukuran_baju: ukuran, mode_kehadiran: mode }).success
        ).toBe(true);
      }
    }
  });
});
