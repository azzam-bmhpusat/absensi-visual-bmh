/**
 * Script: samakan kata sandi SEMUA akun role 'peserta' dengan kata sandi peserta default
 * (env PARTICIPANT_DEFAULT_PASSWORD atau "rakernas2027", lihat lib/participant-account.ts).
 *
 * Penggunaan:
 *   npm run reset:peserta-passwords            # DRY-RUN: hanya menghitung akun
 *   npm run reset:peserta-passwords -- --apply # mengubah kata sandi di Supabase Auth
 *
 * Tidak bisa dibatalkan: kata sandi yang dibuat peserta sendiri ikut ditimpa.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { getParticipantPassword } from "../lib/participant-account";

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

const APPLY = process.argv.includes("--apply");
const PAGE = 1000;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum lengkap di .env.local");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const peserta: { id: string; email: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("profiles")
      .select("id, email")
      .eq("role", "peserta")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    peserta.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }

  console.log(`Akun peserta: ${peserta.length}`);
  if (!APPLY) {
    console.log("DRY-RUN: tidak ada yang diubah. Jalankan dengan --apply untuk mengganti kata sandi.");
    return;
  }

  const password = getParticipantPassword();
  const failed: string[] = [];
  for (const p of peserta) {
    const { error } = await db.auth.admin.updateUserById(p.id, { password });
    if (error) {
      failed.push(`${p.email ?? p.id}: ${error.message}`);
    }
  }
  console.log(`✅ Berhasil: ${peserta.length - failed.length}`);
  if (failed.length) {
    console.log(`❌ Gagal: ${failed.length}`);
    for (const f of failed) console.log(`   - ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
