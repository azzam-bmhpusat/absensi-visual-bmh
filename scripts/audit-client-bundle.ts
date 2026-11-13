/**
 * Script: Audit Bundle Client (.next/static)
 *
 * Memastikan tidak ada SUPABASE_SERVICE_ROLE_KEY atau string "service_role"
 * yang bocor ke dalam bundle klien Next.js.
 *
 * Dijalankan dengan:
 *   npx tsx scripts/audit-client-bundle.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.resolve(__dirname, "..", ".env.local");
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key === "SUPABASE_SERVICE_ROLE_KEY" && !serviceRoleKey) {
      serviceRoleKey = val;
    }
  }
}

const staticDir = path.resolve(__dirname, "..", ".next", "static");

console.log("═══════════════════════════════════════════════");
console.log("  Audit Bundle Client: Leak Security Check");
console.log("═══════════════════════════════════════════════\n");

if (!fs.existsSync(staticDir)) {
  console.error("❌ Direktori .next/static tidak ditemukan! Jalankan `npm run build` terlebih dahulu.");
  process.exit(1);
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (/\.(js|json|txt|html)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const targetFiles = getAllFiles(staticDir);
console.log(`🔍 Memeriksa ${targetFiles.length} file statis di .next/static...\n`);

let leaksFound = 0;

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(path.resolve(__dirname, ".."), filePath);

  if (serviceRoleKey && content.includes(serviceRoleKey)) {
    console.error(`❌ KEBOCORAN KREDENSIAL: Nilai SUPABASE_SERVICE_ROLE_KEY ditemukan di: ${relativePath}`);
    leaksFound++;
  }

  // Periksa token/string eksplisit yang mengindikasikan service role JWT payload
  if (content.includes('"role":"service_role"') || content.includes('"service_role"')) {
    console.error(`❌ KEBOCORAN KREDENSIAL: String "service_role" terdeteksi di: ${relativePath}`);
    leaksFound++;
  }
}

if (leaksFound === 0) {
  console.log("✅ AUDIT LULUS: Tidak ada SUPABASE_SERVICE_ROLE_KEY atau 'service_role' pada bundle klien.");
  process.exit(0);
} else {
  console.error(`\n❌ AUDIT GAGAL: Ditemukan ${leaksFound} potensi kebocoran kredensial di bundle klien.`);
  process.exit(1);
}
