/**
 * Script: UAT Simulation & Verification Test Suite (Fase 6)
 *
 * Menguji skenario:
 * 1. Absen Hari 1 dan Hari 2 untuk orang yang sama -> keduanya tercatat
 * 2. Absen ganda di sesi sama -> ditolak dengan status "already" ("sudah tercatat")
 * 3. Tamu dadakan (walk-in) -> tercatat dengan is_walk_in = true
 * 4. Simulasi beban 30 submit berurutan cepat -> semua tercatat, tanpa duplikat / hilang
 * 5. Ekspor CSV rekap vs data database -> format UTF-8 BOM, waktu WIB, kecocokan data
 * 6. Derivasi data videotron -> counter kehadiran, total tamu, walk-in handling
 *
 * Jalankan:
 *   npx tsx scripts/run-uat-simulation.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { normalizeCompare, normalizeString } from "../lib/normalize";
import { attendanceSchema } from "../lib/schemas";
import { exportAttendanceToCsv } from "../lib/csv";
import { deriveAttendanceData, type GuestData, type AttendanceData } from "../lib/display-helpers";

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

let passedTests = 0;
let failedTests = 0;

function assert(description: string, condition: boolean, extraInfo?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${description}${extraInfo ? ` (${extraInfo})` : ""}`);
    failedTests++;
  }
}

/**
 * Simulasi alur submitAttendance persis seperti Server Action di app/absen/actions.ts
 */
async function simulateSubmitAttendance(input: {
  sessionId: 1 | 2;
  guestId?: string;
  nama: string;
  perwakilanDaerah: string;
  website?: string;
}) {
  // Honeypot check
  if (input.website && input.website.trim().length > 0) {
    return {
      status: "ok" as const,
      nama: input.nama ? normalizeString(input.nama) : "",
      sesi: input.sessionId === 1 ? "Hari Pertama" : "Hari Kedua",
      isHoneypot: true,
    };
  }

  // Zod validation
  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error" as const,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { sessionId, nama, perwakilanDaerah } = parsed.data;
  let guestId: string | null = parsed.data.guestId ?? null;
  let finalNama = nama;
  let finalDaerah = perwakilanDaerah;
  let isWalkIn = false;

  if (guestId) {
    const { data: guest } = await supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah")
      .eq("id", guestId)
      .maybeSingle();

    if (guest) {
      finalNama = guest.nama;
      finalDaerah = guest.perwakilan_daerah;
    } else {
      guestId = null;
    }
  }

  if (!guestId) {
    const normNama = normalizeCompare(nama);
    const normDaerah = normalizeCompare(perwakilanDaerah);

    const { data: matchedGuests } = await supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah");

    const matched = (matchedGuests || []).find(
      (g) =>
        normalizeCompare(g.nama) === normNama &&
        normalizeCompare(g.perwakilan_daerah) === normDaerah
    );

    if (matched) {
      guestId = matched.id;
      finalNama = matched.nama;
      finalDaerah = matched.perwakilan_daerah;
      isWalkIn = false;
    } else {
      isWalkIn = true;
    }
  }

  const sesiLabel = sessionId === 1 ? "Hari Pertama" : "Hari Kedua";

  const { data: inserted, error } = await supabase
    .from("attendances")
    .insert({
      session_id: sessionId,
      guest_id: guestId,
      nama: finalNama,
      perwakilan_daerah: finalDaerah,
      is_walk_in: isWalkIn,
    })
    .select("id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        status: "already" as const,
        message: `Anda sudah tercatat hadir di ${sesiLabel}.`,
      };
    }
    return {
      status: "error" as const,
      message: error.message,
    };
  }

  return {
    status: "ok" as const,
    nama: finalNama,
    sesi: sesiLabel,
    attendance: inserted,
  };
}

async function main() {
  console.log("══════════════════════════════════════════════════════════════");
  console.log("  BMH SISTEM ABSENSI QR — SIMULASI UAT & PERSYARATAN HARI-H   ");
  console.log("══════════════════════════════════════════════════════════════\n");

  // Persiapan awal: Bersihkan attendances uji lama agar pengujian mulai dari state bersih
  console.log("🧹 Menyiapkan state awal database...");
  await supabase.from("attendances").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const { data: guestList, error: guestErr } = await supabase
    .from("guests")
    .select("id, nama, perwakilan_daerah")
    .order("nama");

  if (guestErr || !guestList || guestList.length === 0) {
    console.error("❌ Gagal membaca daftar tamu master (guests kosong).");
    process.exit(1);
  }
  console.log(`ℹ️ Terdeteksi ${guestList.length} tamu master di database.\n`);

  const sampleGuest = guestList[0]; // Tamu pertama untuk pengujian multi-hari & anti-duplikat

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 1: Absen Hari 1 dan Hari 2 untuk orang yang sama
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`📌 [Uji 1] Absen Multi-Hari untuk "${sampleGuest.nama}" (${sampleGuest.perwakilan_daerah})`);

  const resHari1 = await simulateSubmitAttendance({
    sessionId: 1,
    guestId: sampleGuest.id,
    nama: sampleGuest.nama,
    perwakilanDaerah: sampleGuest.perwakilan_daerah,
  });
  assert("Absen Hari 1 berhasil (status: ok)", resHari1.status === "ok");

  const resHari2 = await simulateSubmitAttendance({
    sessionId: 2,
    guestId: sampleGuest.id,
    nama: sampleGuest.nama,
    perwakilanDaerah: sampleGuest.perwakilan_daerah,
  });
  assert("Absen Hari 2 untuk orang yang sama berhasil (status: ok)", resHari2.status === "ok");

  // Verifikasi di DB
  const { data: attMultiDay } = await supabase
    .from("attendances")
    .select("session_id, guest_id, nama, perwakilan_daerah, is_walk_in")
    .eq("guest_id", sampleGuest.id);

  assert(
    "Orang yang sama tercatat tepat di kedua sesi (Hari 1 & Hari 2)",
    attMultiDay?.length === 2 &&
      attMultiDay.some((a) => a.session_id === 1) &&
      attMultiDay.some((a) => a.session_id === 2)
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 2: Anti-Duplikat pada Sesi yang Sama
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📌 [Uji 2] Anti-Duplikat pada Sesi Sama`);
  const resDuplicate = await simulateSubmitAttendance({
    sessionId: 1,
    guestId: sampleGuest.id,
    nama: sampleGuest.nama,
    perwakilanDaerah: sampleGuest.perwakilan_daerah,
  });
  assert(
    "Absen kedua kali di Hari 1 menghasilkan status 'already'",
    resDuplicate.status === "already"
  );
  if (resDuplicate.status === "already") {
    assert(
      "Pesan ramah berbahasa Indonesia ditampilkan",
      resDuplicate.message.includes("Anda sudah tercatat hadir di Hari Pertama")
    );
  }

  // Cek jumlah di DB tidak bertambah
  const { count: countHari1 } = await supabase
    .from("attendances")
    .select("*", { count: "exact", head: true })
    .eq("session_id", 1)
    .eq("guest_id", sampleGuest.id);
  assert("Tidak ada duplikasi baris di database (tetap 1 baris)", countHari1 === 1);

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 3: Tamu Dadakan (Walk-in)
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📌 [Uji 3] Tamu Dadakan (Walk-In)`);
  const walkInName = "Ustadz Hidayatullah";
  const walkInRegion = "BMH Papua Barat";

  const resWalkIn = await simulateSubmitAttendance({
    sessionId: 1,
    nama: walkInName,
    perwakilanDaerah: walkInRegion,
  });
  assert("Absen tamu walk-in berhasil (status: ok)", resWalkIn.status === "ok");

  const { data: dbWalkIn } = await supabase
    .from("attendances")
    .select("*")
    .eq("nama", walkInName)
    .eq("session_id", 1)
    .maybeSingle();

  assert("Baris walk-in tersimpan dengan is_walk_in = true", dbWalkIn?.is_walk_in === true);
  assert("Baris walk-in memiliki guest_id = null", dbWalkIn?.guest_id === null);

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 4: Simulasi Beban 30 Submit Berurutan Cepat (Load / Stress Test)
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📌 [Uji 4] Simulasi Beban 30 Submit Berurutan Cepat`);
  const regions = [
    "BMH Jawa Timur",
    "BMH Jawa Barat",
    "BMH Jawa Tengah",
    "BMH DKI Jakarta",
    "BMH DI Yogyakarta",
    "BMH Sumatera Utara",
  ];

  const startTime = Date.now();
  const batchCount = 30;
  const submitPromises: ReturnType<typeof simulateSubmitAttendance>[] = [];

  for (let i = 1; i <= batchCount; i++) {
    const region = regions[(i - 1) % regions.length];
    submitPromises.push(
      simulateSubmitAttendance({
        sessionId: 1,
        nama: `Peserta Uji Sim ${i}`,
        perwakilanDaerah: region,
      })
    );
  }

  const batchResults = await Promise.all(submitPromises);
  const totalDuration = Date.now() - startTime;
  const avgDuration = totalDuration / batchCount;

  const successfulBatch = batchResults.filter((r) => r.status === "ok").length;
  assert(`Semua ${batchCount} submit berhasil diproses (actual: ${successfulBatch}/${batchCount})`, successfulBatch === batchCount);
  console.log(`  ⏱️ Waktu total 30 submit: ${totalDuration}ms (Rata-rata: ${avgDuration.toFixed(1)}ms/submit)`);

  const { data: allSession1Att } = await supabase
    .from("attendances")
    .select("nama, is_walk_in")
    .eq("session_id", 1);

  const simNames = allSession1Att?.filter((a) => a.nama.startsWith("Peserta Uji Sim ")) || [];
  assert(`Semua 30 data batch tersimpan di DB tanpa hilang (actual: ${simNames.length})`, simNames.length === batchCount);

  // Pastikan tidak ada duplikasi nama
  const uniqueNames = new Set(simNames.map((s) => s.nama));
  assert("Tidak ada nama duplikat dalam batch", uniqueNames.size === batchCount);

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 5: Ekspor CSV Rekap vs Data Layar
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📌 [Uji 5] Validasi Integritas Ekspor CSV Rekap`);
  const { data: fullAttendances } = await supabase
    .from("attendances")
    .select("id, session_id, guest_id, nama, perwakilan_daerah, is_walk_in, checked_in_at")
    .order("checked_in_at", { ascending: false });

  const csvOutput = exportAttendanceToCsv(fullAttendances || []);
  assert("CSV diawali dengan UTF-8 BOM (\\uFEFF) untuk kompatibilitas Excel", csvOutput.startsWith("\uFEFF"));
  assert(
    "Header CSV memuat kolom lengkap (No, Waktu Presensi, Sesi, Nama Tamu, Perwakilan Daerah, Status Kehadiran)",
    csvOutput.includes("No,Waktu Presensi (WIB),Sesi,Nama Tamu,Perwakilan Daerah,Status Kehadiran")
  );

  const lines = csvOutput.trim().split("\n");
  // Baris header + data
  const dataLineCount = lines.length - 1;
  assert(`Jumlah baris data CSV cocok dengan total attendances di database (${dataLineCount} baris)`,
    dataLineCount === (fullAttendances?.length || 0)
  );

  // ──────────────────────────────────────────────────────────────────────────
  // Uji 6: Derivasi Logika Videotron (/display)
  // ──────────────────────────────────────────────────────────────────────────
  console.log(`\n📌 [Uji 6] Validasi Logika Tampilan Videotron (/display)`);
  const derived = deriveAttendanceData(
    guestList as GuestData[],
    (fullAttendances || []) as AttendanceData[],
    1
  );

  // Total tamu undangan terdaftar tidak boleh bertambah oleh walk-in
  assert(
    `Total undangan videotron tetap sama dengan master guests (${guestList.length})`,
    derived.totalGuests === guestList.length
  );

  // Hadir mencakup tamu terdaftar + walk-in
  const actualHadirSesi1 = fullAttendances?.filter((a) => a.session_id === 1).length || 0;
  assert(`Jumlah 'Hadir' pada videotron mencakup seluruh kehadiran sesi 1 (${actualHadirSesi1})`,
    derived.hadir.length === actualHadirSesi1
  );

  // Tamu walk-in harus ada di kolom hadir dengan is_walk_in = true
  const walkInOnBoard = derived.hadir.find((h) => h.nama === walkInName);
  assert("Tamu dadakan tampil di kolom 'Sudah Hadir' videotron", !!walkInOnBoard);
  assert("Tamu dadakan memiliki penanda walk-in", walkInOnBoard?.is_walk_in === true);

  // Belum hadir harus berkurang untuk tamu terdaftar yang sudah hadir
  const sampleInBelumHadir = derived.belumHadir.find((b) => b.id === sampleGuest.id);
  assert("Tamu terdaftar yang sudah hadir berpindah dari kolom 'Belum Hadir'", !sampleInBelumHadir);

  // ──────────────────────────────────────────────────────────────────────────
  // Ringkasan Hasil
  // ──────────────────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════");
  console.log(`  HASIL SIMULASI UAT: ${passedTests} LULUS, ${failedTests} GAGAL`);
  console.log("══════════════════════════════════════════════════════════════\n");

  if (failedTests > 0) {
    console.error(`❌ Terdapat ${failedTests} pengujian UAT yang gagal.`);
    process.exit(1);
  } else {
    console.log("🎉 SELURUH PENGUJIAN UAT LOGIS & BEBAN LULUS 100%!");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
