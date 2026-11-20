/**
 * Script: Buat Akun Panitia Admin Supabase Auth
 *
 * Menggunakan Supabase Admin API untuk mendaftarkan akun admin
 * dengan status email terkonfirmasi langsung (email_confirm: true).
 *
 * Penggunaan:
 *   npx tsx scripts/create-admin.ts [email] [password]
 *
 * Default:
 *   Email:    admin@bmh.or.id
 *   Password: www.bmh.or.id
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Environment variables Supabase belum lengkap di .env.local");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL || "admin@bmh.or.id";
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || "www.bmh.or.id";

  console.log("═══════════════════════════════════════════════");
  console.log("  Pembuatan Akun Admin Supabase Auth");
  console.log("═══════════════════════════════════════════════\n");
  console.log(`Target Email: ${email}`);

  // Cek apakah user sudah ada
  const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
  if (listErr) {
    console.error("❌ Gagal memeriksa daftar pengguna:", listErr.message);
    process.exit(1);
  }

  const existing = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    console.log(`ℹ Pengguna ${email} sudah terdaftar (ID: ${existing.id}). Memperbarui kata sandi...`);
    const { error: updErr } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });

    if (updErr) {
      console.error("❌ Gagal memperbarui kata sandi:", updErr.message);
      process.exit(1);
    }
    console.log("✅ Kata sandi akun admin berhasil diperbarui dan email terkonfirmasi!");
  } else {
    console.log(`Membuat akun baru ${email}...`);
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin", name: "Panitia BMH" },
    });

    if (createErr) {
      console.error("❌ Gagal membuat akun admin:", createErr.message);
      process.exit(1);
    }

    console.log(`✅ Akun admin berhasil dibuat! (ID: ${newUser.user?.id})`);
  }

  // Trigger di database membuat profil baru dengan role 'user'; jadikan akun ini 'admin'.
  const { error: roleErr } = await admin
    .from("profiles")
    .update({ role: "admin" })
    .ilike("email", email);
  if (roleErr) {
    console.warn(
      `⚠ Role admin pada tabel profiles belum diatur (${roleErr.message}). ` +
        "Pastikan migrasi 0008_profiles.sql sudah dijalankan, lalu jalankan ulang skrip ini."
    );
  } else {
    console.log("✅ Role 'admin' diterapkan pada tabel profiles.");
  }

  console.log("\nKredensial Login Admin:");
  console.log(`- Email:    ${email}`);
  console.log(`- Password: ${password}`);
  console.log(`- URL:      /admin/login`);
  console.log("═══════════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
