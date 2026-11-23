import { describe, it, expect } from "vitest";
import { WHATSAPP_TEMPLATE, withWhatsAppTemplate } from "@/components/rakernas/whatsapp-float";

describe("withWhatsAppTemplate", () => {
  it("menambahkan template salam ke tautan wa.me", () => {
    const href = withWhatsAppTemplate("https://wa.me/6289517795206");
    expect(href).not.toContain("+");
    const url = new URL(href);
    expect(url.pathname).toBe("/6289517795206");
    expect(url.searchParams.get("text")).toBe(WHATSAPP_TEMPLATE);
    expect(WHATSAPP_TEMPLATE.startsWith("Assalamu'alaikum")).toBe(true);
  });

  it("tidak menimpa pesan yang sudah diatur admin", () => {
    const href = "https://wa.me/628123?text=Halo";
    expect(withWhatsAppTemplate(href)).toBe(href);
  });

  it("membiarkan tautan non-WhatsApp dan URL tidak valid", () => {
    expect(withWhatsAppTemplate("https://bmh.or.id")).toBe("https://bmh.or.id");
    expect(withWhatsAppTemplate("bukan url")).toBe("bukan url");
  });
});
