import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ParticipantAccessCard, type ParticipantAccessAccount } from "@/components/auth/participant-access-card";

vi.mock("@/app/(site)/login/actions", () => ({ logoutUser: vi.fn() }));

const contactUrl = "https://wa.me/628123456789?text=Bantuan";
const account: ParticipantAccessAccount = {
  name: "Budi Santoso",
  email: "budi.santoso@gmail.com",
  isNonParticipant: true,
  isGoogle: true,
};
const render = (value: ParticipantAccessAccount | null) => renderToStaticMarkup(
  createElement(ParticipantAccessCard, { account: value, contactUrl }),
);

describe("kartu akses khusus peserta", () => {
  it("menampilkan identitas akun sendiri dan status nonpeserta Google", () => {
    const html = render(account);
    expect(html).toContain(account.email);
    expect(html).toContain(">BS</span>");
    expect(html).toContain("Bukan peserta");
    expect(html).toContain("Akun Google Anda belum terdaftar");
    expect(html).toContain("Keluar dari akun Google ini");
    expect(html).not.toContain("ahmad.fauzi@gmail.com");
  });

  it("tidak mengklaim akun peserta sebagai nonpeserta", () => {
    const html = render({ ...account, isNonParticipant: false, isGoogle: false });
    expect(html).toContain(account.email);
    expect(html).not.toContain("Bukan peserta");
    expect(html).not.toContain("belum terdaftar");
    expect(html).not.toContain("akun Google");
  });

  it("akses tanpa sesi tidak menampilkan identitas atau status palsu", () => {
    const html = render(null);
    expect(html).not.toContain('aria-label="Akun aktif"');
    expect(html).not.toContain("Bukan peserta");
    expect(html).not.toContain("Keluar dari akun");
    expect(html).toContain("Siapkan akun BMH dari panitia");
    expect(html).toContain("Masuk dengan Akun BMH");
  });

  it("memakai kontak acara yang diberikan dan menjaga keamanan tab baru", () => {
    const html = render(null);
    expect(html).toContain(`href="${contactUrl}"`);
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("mempertahankan email panjang dan memakai inisial email bila nama kosong", () => {
    const email = `${"budi".repeat(30)}.santoso@example.com`;
    const html = render({ ...account, email, name: "" });
    expect(html).toContain(email);
    expect(html).toContain(">BS</span>");
  });
});
