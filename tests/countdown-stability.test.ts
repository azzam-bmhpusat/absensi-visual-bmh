import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CountdownSection } from "../components/rakernas/countdown";

describe("CountdownSection Stability & Prerender Guardrail", () => {
  const countdownPath = path.join(__dirname, "../components/rakernas/countdown.tsx");
  const countdownContent = fs.readFileSync(countdownPath, "utf-8");

  it("CountdownSection TIDAK menggunakan useSyncExternalStore dengan Date.now() yang menyebabkan infinite loop", () => {
    // Memastikan useSyncExternalStore dengan Date.now() telah dihapus
    expect(countdownContent).not.toMatch(/useSyncExternalStore[\s\S]*?Date\.now\(\)/);
    // Menggunakan useEffect & useState yang stabil
    expect(countdownContent).toContain("useState<number | null>(null)");
    expect(countdownContent).toContain("useEffect");
    expect(countdownContent).toContain("setInterval");
    expect(countdownContent).toContain("clearInterval(interval)");
  });

  it("CountdownSection merender Skeleton pada saat SSR / Prerender tanpa error", () => {
    // Pada saat server-side render (renderToStaticMarkup), useEffect tidak berjalan
    // sehingga `now` tetap `null`, dan skeleton ditampilkan tanpa hydration mismatch.
    const html = renderToStaticMarkup(
      createElement(CountdownSection as ComponentType<{ target: string; endsAt: string }>, {
        target: "2026-12-01T10:00:00+07:00",
        endsAt: "2026-12-03T12:00:00+07:00",
      })
    );

    expect(html).toContain("Hitung Mundur Acara");
    expect(html).toContain("Hari");
    expect(html).toContain("Jam");
    expect(html).toContain("Menit");
    expect(html).toContain("Detik");
  });

  it("app/(site)/page.tsx mengeset instant = false untuk menonaktifkan validasi instant-shell-url-data", () => {
    const pagePath = path.join(__dirname, "../app/(site)/page.tsx");
    const pageContent = fs.readFileSync(pagePath, "utf-8");

    expect(pageContent).toContain("export const instant = false;");
  });

  it("app/(admin)/pengaturan/page.tsx memanggil await connection() dan mengeset instant = false", () => {
    const pengaturanPath = path.join(__dirname, "../app/(admin)/pengaturan/page.tsx");
    const pengaturanContent = fs.readFileSync(pengaturanPath, "utf-8");

    expect(pengaturanContent).toContain('import { connection } from "next/server";');
    expect(pengaturanContent).toContain("await connection();");
    expect(pengaturanContent).toContain("export const instant = false;");
  });
});
