import { describe, it, expect } from "vitest";
import { checkRateLimit } from "../lib/rate-limit";

describe("Rate Limiting", () => {
  it("mengizinkan hingga limit yang ditentukan", () => {
    const ip = "192.168.1.100";
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip, 10, 60000)).toBe(true);
    }
    // Percobaan ke-11 harus ditolak
    expect(checkRateLimit(ip, 10, 60000)).toBe(false);
  });

  it("memisahkan hitungan antar IP yang berbeda", () => {
    const ipA = "10.0.0.1";
    const ipB = "10.0.0.2";

    for (let i = 0; i < 10; i++) {
      checkRateLimit(ipA, 10, 60000);
    }
    expect(checkRateLimit(ipA, 10, 60000)).toBe(false);
    expect(checkRateLimit(ipB, 10, 60000)).toBe(true);
  });
});
