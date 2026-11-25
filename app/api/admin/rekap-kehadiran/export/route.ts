import { type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkAdmin } from "@/lib/auth/admin";
import { buildAttendanceWorkbook } from "@/lib/attendance-xlsx";
import {
  buildExportFilename,
  type ExportAttendance,
  type ExportGuest,
  type ExportScope,
  type ExportSession,
} from "@/lib/attendance-export";

const PAGE_SIZE = 1000;
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const optionalInt = (min: number, max: number) =>
  z.preprocess((v) => (v === null || v === "" || v === "all" ? undefined : v), z.coerce.number().int().min(min).max(max).optional());

const querySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("all") }),
  z.object({ mode: z.literal("session"), sesi: z.coerce.number().int().positive() }),
  z.object({
    mode: z.literal("filter"),
    hari: optionalInt(1, 3),
    sesi: optionalInt(1, 32767),
    daerah: z.string().trim().max(200).optional(),
    q: z.string().trim().max(200).optional(),
  }),
]);

function jsonError(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

/** Ambil semua baris dengan paginasi (Supabase membatasi 1000 baris per request). */
async function fetchAll<T>(
  supabase: SupabaseServer,
  table: string,
  columns: string,
  orderBy: string,
  sessionId?: number
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from(table).select(columns).order(orderBy, { ascending: true }).order("id", { ascending: true });
    // Daftar peserta = profil yang punya nama (akun admin tanpa nama dikecualikan)
    if (table === "profiles") query = query.not("nama", "is", null);
    if (sessionId !== undefined) query = query.eq("session_id", sessionId);
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`Gagal membaca ${table}: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);
  if (!user) return jsonError(401, "Akses ditolak. Silakan login sebagai admin.");
  if (!isAdmin) return jsonError(403, "Akses ditolak. Akun ini bukan admin.");

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) return jsonError(400, "Parameter ekspor tidak valid.");
  const query = parsed.data;

  try {
    const sessRes = await supabase.from("sessions").select("id, nama, hari").order("id", { ascending: true });
    if (sessRes.error) throw new Error(sessRes.error.message);
    const sessions = (sessRes.data ?? []) as ExportSession[];

    let scope: ExportScope;
    if (query.mode === "all") scope = { kind: "all" };
    else if (query.mode === "session") scope = { kind: "session", sessionId: query.sesi };
    else
      scope = {
        kind: "filter",
        filter: { hari: query.hari, sessionId: query.sesi, daerah: query.daerah || undefined, q: query.q || undefined },
      };

    if (scope.kind === "session" && !sessions.some((s) => s.id === scope.sessionId)) {
      return jsonError(400, "Sesi tidak ditemukan.");
    }

    const sessionFilter =
      scope.kind === "session" ? scope.sessionId : scope.kind === "filter" ? (scope.filter.sessionId ?? undefined) : undefined;

    const [attendances, guests] = await Promise.all([
      fetchAll<ExportAttendance>(
        supabase,
        "attendances",
        "id, session_id, guest_id, nama, perwakilan_daerah, jabatan, kategori, is_walk_in, checked_in_at",
        "checked_in_at",
        sessionFilter
      ),
      scope.kind === "filter"
        ? Promise.resolve([] as ExportGuest[])
        : fetchAll<ExportGuest>(supabase, "profiles", "id, nama, perwakilan_daerah, jabatan, kategori", "nama"),
    ]);

    const buffer = await buildAttendanceWorkbook({ scope, sessions, attendances, guests });
    const filename = buildExportFilename(scope);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": XLSX_TYPE,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error ekspor rekap kehadiran:", err);
    return jsonError(500, "Gagal membuat file Excel. Silakan coba lagi.");
  }
}
