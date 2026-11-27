import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";
import { loadUsers } from "@/lib/user-list";
import { ALL_JABATAN, KEHADIRAN_FILTERS, filterUsers } from "@/lib/user-row";
import { USER_ROLES } from "@/lib/user-schema";
import { buildUserWorkbook } from "@/lib/user-xlsx";
import { buildUserPdf } from "@/lib/user-pdf";
import { buildUserExportFilename, type UserExportScope } from "@/lib/user-export";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const querySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("all"), format: z.enum(["xlsx", "pdf"]).default("xlsx") }),
  z.object({
    mode: z.literal("filter"),
    format: z.enum(["xlsx", "pdf"]).default("xlsx"),
    status: z.enum(["all", "inactive", ...USER_ROLES]).default("all"),
    jabatan: z.string().trim().max(200).default(ALL_JABATAN),
    kehadiran: z.enum(KEHADIRAN_FILTERS).default("all"),
    q: z.string().trim().max(200).default(""),
  }),
]);

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);
  if (!user) return jsonError(401, "Akses ditolak. Silakan login sebagai admin.");
  if (!isAdmin) return jsonError(403, "Akses ditolak. Akun ini bukan admin.");

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return jsonError(400, "Parameter ekspor tidak valid.");
  const query = parsed.data;

  const users = await loadUsers();
  if (!users) return jsonError(500, "Gagal memuat daftar pengguna.");

  try {
    const scope: UserExportScope =
      query.mode === "all"
        ? { kind: "all" }
        : { kind: "filter", filter: { status: query.status, jabatan: query.jabatan || ALL_JABATAN, q: query.q, kehadiran: query.kehadiran } };
    const rows = scope.kind === "all" ? users : filterUsers(users, scope.filter);
    const generatedAt = new Date();
    const buffer = query.format === "pdf"
      ? buildUserPdf(scope, rows, generatedAt)
      : await buildUserWorkbook(scope, rows, generatedAt);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": query.format === "pdf" ? "application/pdf" : XLSX_TYPE,
        "Content-Disposition": `attachment; filename="${buildUserExportFilename(scope, generatedAt, query.format)}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error ekspor manajemen user:", err);
    return jsonError(500, `Gagal membuat file ${query.format === "pdf" ? "PDF" : "Excel"}. Silakan coba lagi.`);
  }
}
