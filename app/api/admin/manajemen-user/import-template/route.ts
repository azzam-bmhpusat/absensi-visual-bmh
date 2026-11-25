import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";
import { buildUserImportTemplate } from "@/lib/user-import";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);
  if (!user) return jsonError(401, "Akses ditolak. Silakan login sebagai admin.");
  if (!isAdmin) return jsonError(403, "Akses ditolak. Akun ini bukan admin.");

  try {
    const buffer = await buildUserImportTemplate();
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_TYPE,
        "Content-Disposition": 'attachment; filename="template-import-user-bmh.xlsx"',
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error template impor user:", err);
    return jsonError(500, "Gagal membuat template. Silakan coba lagi.");
  }
}
