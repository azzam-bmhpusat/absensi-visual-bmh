/**
 * Script: Bersihkan Data Uji Kehadiran (Persiapan Hari-H)
 *
 * Mengosongkan tabel `attendances` agar sistem siap menerima absensi riil
 * pada hari pelaksanaan acara tanpa mengubah daftar tamu master (guests)
 * atau konfigurasi sesi (sessions).
 *
 * Jalankan:
 *   npx tsx scripts/cleanup-test-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── 1. Load .env.local ──────────────────────────────────────────────────
const envPath = path.resolve(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
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
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Variabel lingkungan Supabase belum lengkap di .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("   PEMBERSIHAN DATA UJI COBA KEHADIRAN (PERSIAPAN HARI-H)      ");
  console.log("══════════════════════════════════════════════════════════════\n");

  // 1. Cek jumlah data attendances saat ini
  const { count: beforeCount, error: countErr } = await supabase
    .from("attendances")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("❌ Gagal membaca tabel attendances:", countErr.message);
    process.exit(1);
  }

  console.log(`📊 Status Sebelum Pembersihan:`);
  console.log(`   - Data kehadiran tercatat : ${beforeCount ?? 0} baris`);

  // 2. Bersihkan tabel attendances
  if (beforeCount && beforeCount > 0) {
    console.log(`\n🧹 Menghapus ${beforeCount} baris data absensi uji...`);
    const { error: deleteErr } = await supabase
      .from("attendances")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Hapus semua baris

    if (deleteErr) {
      console.error("❌ Gagal membersihkan tabel attendances:", deleteErr.message);
      process.exit(1);
    }
  } else {
    console.log("\nℹ️ Tabel attendances sudah dalam keadaan kosong.");
  }

  // 3. Verifikasi ulang attendances
  const { count: afterCount } = await supabase
    .from("attendances")
    .select("*", { count: "exact", head: true });

  // 4. Verifikasi keutuhan tabel guests & sessions
  const { count: guestCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("nama", "is", null);

  const { count: sessionCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true });

  console.log(`\n📊 Status Sesudah Pembersihan:`);
  console.log(`   - Data kehadiran (attendances) : ${afterCount ?? 0} baris (BERSIH)`);
  console.log(`   - Data peserta (profiles)        : ${guestCount ?? 0} baris (UTUH)`);
  console.log(`   - Data sesi acara (sessions)   : ${sessionCount ?? 0} baris (UTUH)`);

  if ((afterCount ?? 0) === 0 && (guestCount ?? 0) > 0 && (sessionCount ?? 0) >= 2) {
    console.log("\n✅ SISTEM TELAH DIBERSIHKAN DENGAN SUKSES!");
    console.log("   Database sekarang siap 100% untuk digunakan pada Hari-H acara BMH.");
  } else {
    console.error("\n⚠️ Peringatan: Terdapat ketidaksesuaian verifikasi data pasca pembersihan.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
