import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";
import { loadUsers } from "@/lib/user-list";
import { ALL_JABATAN, filterUsers } from "@/lib/user-row";
import { USER_ROLES } from "@/lib/user-schema";
import { buildUserExportFilename, buildUserWorkbook, type UserExportScope } from "@/lib/user-xlsx";

const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const querySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("all") }),
  z.object({
    mode: z.literal("filter"),
    status: z.enum(["all", "inactive", ...USER_ROLES]).default("all"),
    jabatan: z.string().trim().max(200).default(ALL_JABATAN),
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
        : { kind: "filter", filter: { status: query.status, jabatan: query.jabatan || ALL_JABATAN, q: query.q } };
    const rows = scope.kind === "all" ? users : filterUsers(users, scope.filter);
    const buffer = await buildUserWorkbook(scope, rows);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_TYPE,
        "Content-Disposition": `attachment; filename="${buildUserExportFilename(scope)}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error ekspor manajemen user:", err);
    return jsonError(500, "Gagal membuat file Excel. Silakan coba lagi.");
  }
}
