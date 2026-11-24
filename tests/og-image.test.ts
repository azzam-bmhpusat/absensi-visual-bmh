import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import OpenGraphImage, * as openGraph from "../app/(site)/opengraph-image";
import TwitterImage, * as twitter from "../app/(site)/twitter-image";
import { EVENT_INFO } from "../content/rakernas";

describe("Gambar berbagi sosial", () => {
  it("Open Graph dan Twitter menghasilkan PNG identik berukuran 1200 × 630", async () => {
    const responses = [OpenGraphImage(), TwitterImage()];
    const images = await Promise.all(responses.map(async (response) => {
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("image/png");

      const png = Buffer.from(await response.arrayBuffer());
      expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      expect(png.readUInt32BE(16)).toBe(1200);
      expect(png.readUInt32BE(20)).toBe(630);
      expect(png.length).toBeLessThan(1_000_000);
      return png;
    }));

    expect(images[0]).toEqual(images[1]);
    expect(images[0]).toEqual(await readFile(new URL("../public/og/rakernas-bmh.png", import.meta.url)));
    for (const metadata of [openGraph, twitter]) {
      expect(metadata.alt).toBe(EVENT_INFO.title);
      expect(metadata.size).toEqual({ width: 1200, height: 630 });
      expect(metadata.contentType).toBe("image/png");
    }
  }, 20_000);
});
