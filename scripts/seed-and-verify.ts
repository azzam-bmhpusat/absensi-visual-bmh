/**
 * Script: Seed data tamu uji & Verifikasi DoD Fase 1
 *
 * Menjalankan:
 *   npx tsx scripts/seed-and-verify.ts
 *
 * Memerlukan variabel dari .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Load .env.local secara manual ───────────────────────────────────────
const envPath = path.resolve(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing environment variables. Periksa .env.local");
  process.exit(1);
}

// Klien admin (service role) untuk seeding
const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Klien anon untuk verifikasi RLS
const anon = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let failed = 0;

function assert(label: string, ok: boolean, detail?: string) {
  if (ok) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Fase 1 — Seed & Verify DoD");
  console.log("═══════════════════════════════════════════════\n");

  // ── 1. Seed data tamu via admin ──────────────────────────────────────
  console.log("📦 Seeding data tamu uji...");

  // Parse individual rows from the SQL and insert via admin client
  const guestData = [
    { nama: "Ahmad Fauzi", perwakilan_daerah: "BMH Jawa Timur" },
    { nama: "Siti Khadijah", perwakilan_daerah: "BMH Jawa Timur" },
    { nama: "Muhammad Rizki", perwakilan_daerah: "BMH Jawa Timur" },
    { nama: "Nur Hidayah", perwakilan_daerah: "BMH Jawa Timur" },
    { nama: "Hasan Basri", perwakilan_daerah: "BMH Jawa Timur" },
    { nama: "Dewi Sartika", perwakilan_daerah: "BMH Jawa Barat" },
    { nama: "Ridwan Kamil", perwakilan_daerah: "BMH Jawa Barat" },
    { nama: "Aisyah Putri", perwakilan_daerah: "BMH Jawa Barat" },
    { nama: "Fajar Nugroho", perwakilan_daerah: "BMH Jawa Barat" },
    { nama: "Budi Santoso", perwakilan_daerah: "BMH Jawa Tengah" },
    { nama: "Sri Wahyuni", perwakilan_daerah: "BMH Jawa Tengah" },
    { nama: "Agus Prasetyo", perwakilan_daerah: "BMH Jawa Tengah" },
    { nama: "Ratna Dewi", perwakilan_daerah: "BMH Jawa Tengah" },
    { nama: "Siti Aminah", perwakilan_daerah: "BMH DKI Jakarta" },
    { nama: "Reza Firmansyah", perwakilan_daerah: "BMH DKI Jakarta" },
    { nama: "Lestari Handayani", perwakilan_daerah: "BMH DKI Jakarta" },
    { nama: "Dian Purnama", perwakilan_daerah: "BMH DKI Jakarta" },
    { nama: "Wahyu Hidayat", perwakilan_daerah: "BMH DI Yogyakarta" },
    { nama: "Fitri Rahmawati", perwakilan_daerah: "BMH DI Yogyakarta" },
    { nama: "Arif Wicaksono", perwakilan_daerah: "BMH DI Yogyakarta" },
    { nama: "Mega Safitri", perwakilan_daerah: "BMH DI Yogyakarta" },
    { nama: "Rahmat Harahap", perwakilan_daerah: "BMH Sumatera Utara" },
    { nama: "Sari Lubis", perwakilan_daerah: "BMH Sumatera Utara" },
    { nama: "Irfan Nasution", perwakilan_daerah: "BMH Sumatera Utara" },
    { nama: "Aminah Siregar", perwakilan_daerah: "BMH Sumatera Utara" },
  ];

  // Query existing guests first to ensure idempotency
  const { data: existingGuests } = await admin.from("guests").select("nama,perwakilan_daerah");
  const existingSet = new Set(
    (existingGuests ?? []).map(
      (g) => `${g.nama.trim().toLowerCase()}|${g.perwakilan_daerah.trim().toLowerCase()}`
    )
  );

  const newGuests = guestData.filter(
    (g) => !existingSet.has(`${g.nama.trim().toLowerCase()}|${g.perwakilan_daerah.trim().toLowerCase()}`)
  );

  if (newGuests.length > 0) {
    const { error: insertErr } = await admin.from("guests").insert(newGuests);
    if (insertErr) {
      console.warn("  ⚠ Insert new guests error:", insertErr.message);
    } else {
      console.log(`  ✓ Berhasil menambahkan ${newGuests.length} tamu baru.`);
    }
  } else {
    console.log("  ✓ Semua data tamu sudah ada di database (idempoten).");
  }

  const { data: seeded, error: countErr } = await admin
    .from("guests")
    .select("id", { count: "exact" });

  console.log(
    `  → ${seeded?.length ?? 0} tamu di database${countErr ? ` (error: ${countErr.message})` : ""}\n`
  );

  // ── 2. Verifikasi DoD ────────────────────────────────────────────────
  console.log("🔍 Verifikasi DoD Fase 1:\n");

  // 2a. Anon SELECT sessions
  console.log("[Uji 1] Anon SELECT sessions");
  const { data: sessions, error: sessErr } = await anon
    .from("sessions")
    .select("*");
  assert("Berhasil membaca sessions", !sessErr && sessions !== null);
  assert("Terdapat 2 sesi", sessions?.length === 2);

  // 2b. Anon SELECT guests
  console.log("\n[Uji 2] Anon SELECT guests");
  const { data: guests, error: guestErr } = await anon
    .from("guests")
    .select("*");
  assert("Berhasil membaca guests", !guestErr && guests !== null);
  assert(
    `Terdapat ≥ 25 tamu (actual: ${guests?.length ?? 0})`,
    (guests?.length ?? 0) >= 25
  );

  // Cek distribusi daerah
  const daerahSet = new Set(guests?.map((g) => g.perwakilan_daerah));
  assert(
    `Terdapat ≥ 6 perwakilan daerah (actual: ${daerahSet.size})`,
    daerahSet.size >= 6
  );

  // 2c. Anon SELECT attendances
  console.log("\n[Uji 3] Anon SELECT attendances");
  const { data: atts, error: attErr } = await anon
    .from("attendances")
    .select("*");
  assert("Berhasil membaca attendances", !attErr && atts !== null);

  // 2d. Anon INSERT attendances → DITOLAK oleh RLS
  console.log("\n[Uji 4] Anon INSERT attendances (harus ditolak RLS)");
  const { error: insertErr } = await anon.from("attendances").insert({
    session_id: 1,
    nama: "Hacker Bot",
    perwakilan_daerah: "Nowhere",
  });
  assert(
    "Insert ditolak oleh RLS",
    insertErr !== null && insertErr.code === "42501",
    insertErr ? `code=${insertErr.code}, msg=${insertErr.message}` : "Tidak ada error!"
  );

  // 2e. Anon INSERT guests → DITOLAK oleh RLS
  console.log("\n[Uji 5] Anon INSERT guests (harus ditolak RLS)");
  const { error: gInsertErr } = await anon.from("guests").insert({
    nama: "Hacker Bot",
    perwakilan_daerah: "Nowhere",
  });
  assert(
    "Insert guests ditolak oleh RLS",
    gInsertErr !== null && gInsertErr.code === "42501",
    gInsertErr
      ? `code=${gInsertErr.code}, msg=${gInsertErr.message}`
      : "Tidak ada error!"
  );

  // ── Ringkasan ────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Hasil: ${passed} lulus, ${failed} gagal`);
  console.log("═══════════════════════════════════════════════\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
