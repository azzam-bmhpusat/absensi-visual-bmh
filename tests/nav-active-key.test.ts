import { describe, expect, it } from "vitest";
import { keyForHref, resolveSpyKey } from "@/lib/nav-active-key";

describe("keyForHref", () => {
  it("memetakan href menu dan hash ke kunci", () => {
    expect(keyForHref("/")).toBe("beranda");
    expect(keyForHref("#top")).toBe("beranda");
    expect(keyForHref("#rundown")).toBe("rundown");
    expect(keyForHref("#dresscode")).toBe("dresscode");
    expect(keyForHref("/informasi-kamar-hotel")).toBe("kamar-hotel");
    expect(keyForHref("/publikasi/notula-rapat")).toBe("publikasi");
    expect(keyForHref("/profile")).toBe("profile");
    expect(keyForHref("")).toBeNull();
  });
});

describe("resolveSpyKey", () => {
  it("section yang terlihat menang", () => {
    expect(resolveSpyKey({ sectionKey: "dresscode", scrollY: 0, previous: "beranda" })).toBe("dresscode");
  });
  it("Beranda hanya di dekat paling atas", () => {
    expect(resolveSpyKey({ sectionKey: null, scrollY: 10, previous: "rundown" })).toBe("beranda");
  });
  it("celah antar section mempertahankan kunci sebelumnya", () => {
    expect(resolveSpyKey({ sectionKey: null, scrollY: 900, previous: "rundown" })).toBe("rundown");
  });
});
