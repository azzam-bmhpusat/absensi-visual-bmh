/**
 * Script: Muat peserta dari CSV ekspor guests ke Supabase Auth + tabel profiles.
 *
 * Tiap peserta dibuat sebagai akun Auth (email = nama depan + @bmh.or.id, role 'user', email terkonfirmasi)
 * lalu profilnya diisi semua kolom peserta. Sumber data: CSV ekspor (docs/backup/guests_rows.csv).
 * Tabel guests sudah dihapus (migrasi 0011); skrip ini disimpan untuk memuat ulang peserta dari CSV bila diperlukan.
 *
 * Penggunaan:
 *   npx tsx scripts/migrate-guests-to-profiles.ts                 # DRY-RUN (tidak mengubah apa pun)
 *   npx tsx scripts/migrate-guests-to-profiles.ts --apply         # membuat akun + mengisi profil
 *   npx tsx scripts/migrate-guests-to-profiles.ts --csv path.csv  # CSV lain
 *   npx tsx scripts/migrate-guests-to-profiles.ts --password "..."  # default: env PARTICIPANT_DEFAULT_PASSWORD atau rakernas2027
 *
 * Prasyarat: migrasi 0008, 0009, dan 0010 sudah dijalankan. Aman dijalankan ulang (peserta yang sudah ada dilewati).
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "../lib/simple-csv";
import { nextParticipantEmail } from "../lib/participant-email";
import { createParticipantAccount, getParticipantPassword, type ParticipantFields } from "../lib/participant-account";

// Load .env.local
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!process.env[key]) process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const APPLY = flag("--apply");
const CSV_PATH = path.resolve(root, option("--csv") ?? "docs/backup/guests_rows.csv");
const PASSWORD = option("--password") ?? getParticipantPassword();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum lengkap di .env.local");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

interface SourceRow extends ParticipantFields {
  id: string;
}

async function loadSource(): Promise<SourceRow[]> {
  if (!fs.existsSync(CSV_PATH)) throw new Error("CSV tidak ditemukan: " + CSV_PATH);
  return parseCsv(fs.readFileSync(CSV_PATH, "utf-8")).map((r) => ({
    id: r.id,
    legacy_guest_id: r.id,
    nama: r.nama,
    perwakilan_daerah: r.perwakilan_daerah,
    jabatan: r.jabatan,
    kategori: r.kategori,
    ukuran_baju: r.ukuran_baju,
    created_at: r.created_at,
  }));
}

const personKey = (nama: string, daerah: string) => `${nama.trim().toLowerCase()}|${daerah.trim().toLowerCase()}`;

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log(`  Muat peserta (CSV) → Auth + profiles  [${APPLY ? "APPLY" : "DRY-RUN"}]`);
  console.log("═══════════════════════════════════════════════");
  console.log(`Sumber : ${CSV_PATH}`);

  const source = await loadSource();
  if (source.length === 0) throw new Error("Sumber data kosong.");

  // Cek prasyarat: kolom peserta di profiles harus sudah ada (migrasi 0010).
  const probe = await db.from("profiles").select("id, email, nama, perwakilan_daerah, legacy_guest_id");
  if (probe.error) {
    const hint = "Jalankan migrasi 0008, 0009, dan 0010 terlebih dahulu.";
    if (APPLY) throw new Error(`Tabel/kolom profiles belum siap (${probe.error.message}). ${hint}`);
    console.warn(`⚠ Kolom peserta di profiles belum ada (${probe.error.message}). ${hint}`);
    console.warn("  Dry-run tetap menghitung email dari akun Auth yang ada; peserta yang sudah dipindahkan tidak bisa dideteksi.\n");
  }
  const profiles = (probe.data ?? []) as {
    id: string;
    email: string | null;
    nama: string | null;
    perwakilan_daerah: string | null;
    legacy_guest_id: string | null;
  }[];
  const authList = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authList.error) throw new Error("Gagal membaca akun Auth: " + authList.error.message);

  const takenEmails = new Set<string>([
    ...authList.data.users.map((u) => (u.email ?? "").toLowerCase()),
    ...profiles.map((p) => (p.email ?? "").toLowerCase()),
  ]);
  const byLegacy = new Map(profiles.filter((p) => p.legacy_guest_id).map((p) => [p.legacy_guest_id as string, p]));
  const byPerson = new Map(
    profiles.filter((p) => p.nama).map((p) => [personKey(p.nama as string, (p.perwakilan_daerah as string) ?? ""), p])
  );

  const plan = source.map((row) => {
    const existing = byLegacy.get(row.id) ?? byPerson.get(personKey(row.nama, row.perwakilan_daerah));
    if (existing) return { row, action: "SKIP" as const, email: String(existing.email ?? "") };
    const email = nextParticipantEmail(row.nama, takenEmails);
    takenEmails.add(email);
    return { row, action: "BUAT" as const, email };
  });

  console.log("");
  console.log("No  Aksi  Email                          Nama  (Perwakilan)");
  plan.forEach((p, i) => {
    console.log(
      `${String(i + 1).padStart(2)}  ${p.action.padEnd(5)} ${p.email.padEnd(30)} ${p.row.nama}  (${p.row.perwakilan_daerah})`
    );
  });
  const toCreate = plan.filter((p) => p.action === "BUAT");
  console.log(`\nTotal: ${plan.length} baris | dibuat: ${toCreate.length} | dilewati (sudah ada): ${plan.length - toCreate.length}`);
  console.log(`Role akun: user | Password: ${APPLY ? "(dipakai sesuai pengaturan)" : "tidak ditampilkan"} (${PASSWORD.length} karakter)`);

  if (!APPLY) {
    console.log("\nDRY-RUN selesai: tidak ada perubahan. Jalankan ulang dengan --apply untuk membuat akun.");
    return;
  }

  let ok = 0;
  const failures: string[] = [];
  for (const p of toCreate) {
    const res = await createParticipantAccount(db, { fields: p.row, password: PASSWORD, email: p.email });
    if (res.ok) {
      ok += 1;
      console.log(`  ✅ ${res.email}  ${p.row.nama}`);
    } else {
      failures.push(`${p.row.nama}: ${res.error}`);
      console.error(`  ❌ ${p.row.nama}: ${res.error}`);
    }
  }
  console.log(`\nSelesai: ${ok}/${toCreate.length} akun dibuat.`);
  if (failures.length > 0) {
    console.error(`Gagal ${failures.length}:\n- ${failures.join("\n- ")}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
