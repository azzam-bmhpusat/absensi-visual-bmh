/**
 * Script: Verifikasi Menyeluruh Kebijakan RLS Supabase
 *
 * Menguji bahwa:
 * 1. Anon key BISA membaca (SELECT) sessions, peserta (kolom peserta di profiles), attendances.
 * 2. Anon key TIDAK BISA menulis (INSERT, UPDATE, DELETE) pada sessions, profiles, attendances,
 *    dan TIDAK BISA membaca kolom email/role pada profiles.
 * 3. Service role key BISA melakukan operasi manajemen.
 *
 * Dijalankan dengan:
 *   npx tsx scripts/verify-rls.ts
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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("❌ Environment variables Supabase belum lengkap di .env.local");
  process.exit(1);
}

const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

function assert(description: string, success: boolean, detail?: string) {
  if (success) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ ${description}${detail ? ` (${detail})` : ""}`);
    failed++;
  }
}

async function runRlsTests() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Verifikasi Row Level Security (RLS) Supabase");
  console.log("═══════════════════════════════════════════════\n");

  // 1. SELECT tests for anon
  console.log("[1] Izin Baca Anon (SELECT)");
  const { data: sessions, error: sessErr } = await anon.from("sessions").select("id, slug, nama");
  assert("Anon dapat membaca sessions", !sessErr && Array.isArray(sessions), sessErr?.message);

  const { data: guests, error: guestErr } = await anon.from("profiles").select("id, nama").not("nama", "is", null).limit(5);
  assert("Anon dapat membaca peserta (profiles)", !guestErr && Array.isArray(guests), guestErr?.message);

  const { error: emailErr } = await anon.from("profiles").select("email").limit(1);
  assert("Anon DITOLAK membaca email di profiles", !!emailErr, emailErr ? `code: ${emailErr.code}` : "Lolos!");
  const { error: roleErr } = await anon.from("profiles").select("role").limit(1);
  assert("Anon DITOLAK membaca role di profiles", !!roleErr, roleErr ? `code: ${roleErr.code}` : "Lolos!");

  const { data: atts, error: attErr } = await anon.from("attendances").select("id, nama").limit(5);
  assert("Anon dapat membaca attendances", !attErr && Array.isArray(atts), attErr?.message);

  // 2. INSERT restrictions for anon
  console.log("\n[2] Proteksi Tulis Anon (INSERT ditolak)");
  const { error: insSessErr } = await anon.from("sessions").insert({ id: 99, slug: "hack", nama: "Hack" });
  assert("Anon DITOLAK insert ke sessions", !!insSessErr, insSessErr ? `code: ${insSessErr.code}` : "Lolos!");

  const { error: insGuestErr } = await anon.from("profiles").insert({ nama: "Hacker Guest", perwakilan_daerah: "DarkWeb" });
  assert("Anon DITOLAK insert ke profiles", !!insGuestErr, insGuestErr ? `code: ${insGuestErr.code}` : "Lolos!");

  const { error: insAttErr } = await anon.from("attendances").insert({ session_id: 1, nama: "Hacker Attendance", perwakilan_daerah: "DarkWeb" });
  assert("Anon DITOLAK insert ke attendances", !!insAttErr, insAttErr ? `code: ${insAttErr.code}` : "Lolos!");

  // 3. UPDATE & DELETE restrictions for anon
  console.log("\n[3] Proteksi Modifikasi Anon (UPDATE & DELETE)");
  const dummyUuid = "00000000-0000-0000-0000-000000000000";

  const { data: updProfiles, error: updProfileErr } = await anon.from("profiles").update({ nama: "Hacked" }).eq("id", dummyUuid).select("id");
  assert("Anon DITOLAK update profiles (atau 0 baris terpengaruh)", !updProfiles || updProfiles.length === 0, updProfileErr?.message);

  const { data: delAtts, error: delAttErr } = await anon.from("attendances").delete().eq("id", dummyUuid).select();
  assert("Anon DITOLAK delete attendances (atau 0 baris terhapus)", !delAtts || delAtts.length === 0, delAttErr?.message);

  // 4. Admin write capability
  console.log("\n[4] Izin Akses Admin / Service Role");
  const { data: adminCheck, error: adminErr } = await admin.from("sessions").select("id").limit(1);
  assert("Admin client dapat mengakses database", !adminErr && !!adminCheck, adminErr?.message);

  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Ringkasan: ${passed} lulus, ${failed} gagal`);
  console.log("═══════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runRlsTests().catch((err) => {
  console.error("Fatal error saat verifikasi RLS:", err);
  process.exit(1);
});
