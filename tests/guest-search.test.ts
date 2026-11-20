import { describe, expect, it } from "vitest";
import { buildGuestSearchFilter, parseGuestSearchParams } from "@/lib/guest-search";

describe("Guest search parameters and literal filters", () => {
  it("menormalisasi spasi dan memakai halaman pertama secara default", () => {
    expect(parseGuestSearchParams(new URLSearchParams({ q: "  Jawa   Barat  " }))).toEqual({ query: "Jawa Barat", page: 1 });
  });

  it.each(["", "a", " ", "a".repeat(101), "Ali\u0000"])("menolak kata kunci tidak valid: %j", (q) => {
    expect(parseGuestSearchParams(new URLSearchParams({ q }))).toBeNull();
  });

  it.each(["0", "-1", "1.5", "NaN", "", "9007199254740991"])("menolak halaman tidak valid: %j", (page) => {
    expect(parseGuestSearchParams(new URLSearchParams({ q: "Ali", page }))).toBeNull();
  });

  it("menerima kata kunci Unicode dan batas 100 karakter", () => {
    expect(parseGuestSearchParams(new URLSearchParams({ q: "محمد", page: "2" }))).toEqual({ query: "محمد", page: 2 });
    expect(parseGuestSearchParams(new URLSearchParams({ q: "a".repeat(100) }))).not.toBeNull();
  });

  it("mencari sebagian teks tanpa membedakan kapitalisasi pada empat kolom", () => {
    expect(buildGuestSearchFilter("Ali")).toBe('nama.ilike."%Ali%",perwakilan_daerah.ilike."%Ali%",jabatan.ilike."%Ali%",departemen.ilike."%Ali%"');
  });

  it("dapat memakai daftar kolom kustom (pendaftar memakai perwakilan_bmh)", () => {
    expect(buildGuestSearchFilter("Ali", ["nama", "perwakilan_bmh"])).toBe('nama.ilike."%Ali%",perwakilan_bmh.ilike."%Ali%"');
  });

  it("mengutip koma, tanda kutip, apostrof, kurung, dan backslash sebagai nilai", () => {
    const query = 'O\'Connor, "Ketua" (IT) \\';
    const filter = buildGuestSearchFilter(query);
    const value = JSON.stringify('%O\'Connor, "Ketua" (IT) \\\\%');
    expect(filter).toBe(["nama", "perwakilan_daerah", "jabatan", "departemen"].map((field) => `${field}.ilike.${value}`).join(","));
  });

  it("tidak menjadikan persen dan underscore sebagai wildcard", () => {
    expect(buildGuestSearchFilter("A_B%")).toContain(String.raw`nama.ilike."%A\\_B\\%%"`);
  });

  it("mencari bintang literal tanpa membuka wildcard atau ekspresi regex", () => {
    expect(buildGuestSearchFilter("a*.(b)")).toContain(String.raw`nama.imatch."a\\*\\.\\(b\\)"`);
  });
});
