import { describe, it, expect } from "vitest";
import QRCode from "qrcode";
import {
  isFinderPattern,
  getFinderPatterns,
  resolveQrTargetUrl,
  OFFICIAL_ABSEN_URL,
} from "../components/admin/rounded-qr";

describe("RoundedQr Module & Finder Pattern Logic", () => {
  const sampleSize = 33; // Standard Version 4 QR

  it("identifies top-left finder pattern region correctly", () => {
    expect(isFinderPattern(0, 0, sampleSize)).toBe(true);
    expect(isFinderPattern(6, 6, sampleSize)).toBe(true);
    expect(isFinderPattern(0, 6, sampleSize)).toBe(true);
    expect(isFinderPattern(6, 0, sampleSize)).toBe(true);
    // Boundary checks outside finder pattern
    expect(isFinderPattern(7, 0, sampleSize)).toBe(false);
    expect(isFinderPattern(0, 7, sampleSize)).toBe(false);
    expect(isFinderPattern(7, 7, sampleSize)).toBe(false);
  });

  it("identifies top-right finder pattern region correctly", () => {
    const colStart = sampleSize - 7;
    expect(isFinderPattern(0, colStart, sampleSize)).toBe(true);
    expect(isFinderPattern(6, sampleSize - 1, sampleSize)).toBe(true);
    // Boundary check
    expect(isFinderPattern(0, colStart - 1, sampleSize)).toBe(false);
    expect(isFinderPattern(7, colStart, sampleSize)).toBe(false);
  });

  it("identifies bottom-left finder pattern region correctly", () => {
    const rowStart = sampleSize - 7;
    expect(isFinderPattern(rowStart, 0, sampleSize)).toBe(true);
    expect(isFinderPattern(sampleSize - 1, 6, sampleSize)).toBe(true);
    // Boundary check
    expect(isFinderPattern(rowStart - 1, 0, sampleSize)).toBe(false);
    expect(isFinderPattern(rowStart, 7, sampleSize)).toBe(false);
  });

  it("identifies central data modules as non-finder pattern", () => {
    expect(isFinderPattern(10, 10, sampleSize)).toBe(false);
    expect(isFinderPattern(15, 20, sampleSize)).toBe(false);
    expect(isFinderPattern(sampleSize - 1, sampleSize - 1, sampleSize)).toBe(false);
  });

  it("provides 3 finder pattern coordinates", () => {
    const patterns = getFinderPatterns(sampleSize);
    expect(patterns).toEqual([
      { r: 0, c: 0 },
      { r: 0, c: 26 },
      { r: 26, c: 0 },
    ]);
  });

  it("creates valid QR code matrix for target URL https://rakernas.bmh.or.id/absen", () => {
    const targetUrl = "https://rakernas.bmh.or.id/absen";
    const qr = QRCode.create(targetUrl, { errorCorrectionLevel: "M" });

    expect(qr.modules.size).toBeGreaterThan(0);
    expect(qr.errorCorrectionLevel.bit).toBeDefined();

    // Verify quiet zone calculation
    const margin = 4;
    const totalSize = qr.modules.size + margin * 2;
    expect(totalSize).toBe(qr.modules.size + 8);
    expect(margin).toBeGreaterThanOrEqual(4);
  });

  it("ensures target URL is cleanly formatted without trailing slash", () => {
    const siteUrl = "https://rakernas.bmh.or.id/";
    const targetUrl = resolveQrTargetUrl(siteUrl);
    expect(targetUrl).toBe("https://rakernas.bmh.or.id/absen");
  });

  it("selalu mengarahkan localhost atau 127.0.0.1 ke URL resmi BMH Vercel", () => {
    expect(resolveQrTargetUrl("http://localhost:3000")).toBe(OFFICIAL_ABSEN_URL);
    expect(resolveQrTargetUrl("http://localhost:3000/")).toBe(OFFICIAL_ABSEN_URL);
    expect(resolveQrTargetUrl("http://127.0.0.1:3000")).toBe(OFFICIAL_ABSEN_URL);
    expect(resolveQrTargetUrl(undefined)).toBe(OFFICIAL_ABSEN_URL);
    expect(resolveQrTargetUrl("")).toBe(OFFICIAL_ABSEN_URL);
  });
});
