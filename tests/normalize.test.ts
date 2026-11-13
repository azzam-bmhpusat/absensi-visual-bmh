import { describe, it, expect } from "vitest";
import { normalizeString, normalizeCompare } from "../lib/normalize";

describe("normalizeString", () => {
  it("menghapus spasi di awal dan akhir", () => {
    expect(normalizeString("  Ahmad  ")).toBe("Ahmad");
  });

  it("mengompres spasi ganda di tengah menjadi satu spasi", () => {
    expect(normalizeString("Ahmad   Dahlan")).toBe("Ahmad Dahlan");
  });

  it("menangani tab dan newline", () => {
    expect(normalizeString("Ahmad\t\n  Dahlan")).toBe("Ahmad Dahlan");
  });

  it("mengembalikan string kosong dari string whitespace", () => {
    expect(normalizeString("   ")).toBe("");
  });

  it("tidak mengubah string yang sudah bersih", () => {
    expect(normalizeString("Ahmad Dahlan")).toBe("Ahmad Dahlan");
  });

  it("menangani string satu kata", () => {
    expect(normalizeString("  Surabaya  ")).toBe("Surabaya");
  });
});

describe("normalizeCompare", () => {
  it("menghasilkan lowercase dari string yang sudah dinormalisasi", () => {
    expect(normalizeCompare("  Ahmad  DAHLAN  ")).toBe("ahmad dahlan");
  });

  it("dua string berbeda kapitalisasi dan spasi harus cocok", () => {
    const a = normalizeCompare("  Ahmad Dahlan  ");
    const b = normalizeCompare("ahmad   dahlan");
    expect(a).toBe(b);
  });

  it("mengembalikan string kosong dari whitespace", () => {
    expect(normalizeCompare("   ")).toBe("");
  });
});
