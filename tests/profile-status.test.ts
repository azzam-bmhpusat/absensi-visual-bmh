import { describe, expect, it } from "vitest";
import { isProfileComplete, profileStatus } from "@/lib/profile-contact";

const full = {
  nama: "A",
  perwakilan_daerah: "Jatim",
  jabatan: "Kepala",
  ukuran_baju: "L",
  no_whatsapp: "0812",
  rencana_kedatangan: "2026-01-01",
  keterangan_kehadiran: "hadir",
};

describe("profileStatus", () => {
  it("empty when nothing filled or whitespace only", () => {
    expect(profileStatus(null)).toEqual({ status: "empty", filled: 0, total: 7 });
    expect(profileStatus({ nama: "  " }).status).toBe("empty");
  });
  it("progress when partly filled", () => {
    expect(profileStatus({ nama: "A", jabatan: "B" })).toEqual({ status: "progress", filled: 2, total: 7 });
  });
  it("complete when all filled", () => {
    expect(profileStatus(full).status).toBe("complete");
    expect(isProfileComplete(full)).toBe(true);
    expect(isProfileComplete({ ...full, no_whatsapp: null })).toBe(false);
  });
});
