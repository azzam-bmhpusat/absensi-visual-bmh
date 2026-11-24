import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => fs.readFileSync(path.join(__dirname, "..", file), "utf-8");

// Google mensyaratkan kebijakan privasi publik untuk verifikasi merek aplikasi OAuth.
describe("/kebijakan-privasi", () => {
  const page = read("app/(site)/kebijakan-privasi/page.tsx");

  it("menjelaskan data Google, penggunaan, dan cara meminta penghapusan ke panitia", () => {
    expect(page).toContain("Login dengan Google");
    expect(page).toContain("Hak Anda dan penghapusan data");
    expect(page).toContain("FOOTER_DATA.committee");
    expect(page).toContain("myaccount.google.com/connections");
  });

  it("publik: tidak dibatasi login di middleware maupun ProfileGate", () => {
    expect(read("lib/supabase/middleware.ts")).not.toContain("/kebijakan-privasi");
    expect(page).not.toContain("ProfileGate");
  });

  it("ditautkan dari footer dan halaman login", () => {
    expect(read("components/rakernas/site-footer.tsx")).toContain('href="/kebijakan-privasi"');
    expect(read("components/auth/login-form.tsx")).toContain('href="/kebijakan-privasi"');
  });
});
