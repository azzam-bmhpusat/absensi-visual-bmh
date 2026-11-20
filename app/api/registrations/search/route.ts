import { INVITED_GUESTS_CONTENT } from "@/content/rakernas";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  buildGuestSearchFilter,
  GUEST_SEARCH_PAGE_SIZE,
  parseGuestSearchParams,
  REGISTRATION_SEARCH_COLUMNS,
  type RegistrationSearchResponse,
} from "@/lib/guest-search";

const headers = { "Cache-Control": "no-store" };

// Pencarian publik atas pendaftar yang BELUM di-approve ("belum diterima").
// Tabel registrations tertutup untuk anon, jadi dibaca lewat service role di server dan
// hanya mengembalikan kolom publik (tanpa ukuran baju / mode kehadiran / status).
export async function GET(request: Request) {
  const params = parseGuestSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return Response.json({ message: INVITED_GUESTS_CONTENT.invalidRequest }, { status: 400, headers });
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  if (!checkRateLimit(`regsearch:${ip}`, 60)) {
    return Response.json(
      { message: "Terlalu banyak pencarian, coba sebentar lagi." },
      { status: 429, headers },
    );
  }

  try {
    const supabase = createAdminClient();
    const start = (params.page - 1) * GUEST_SEARCH_PAGE_SIZE;
    const { data, count, error } = await supabase
      .from("registrations")
      .select("id, nama, perwakilan_bmh, jabatan, departemen", { count: "exact" })
      .eq("status", "pending")
      .or(buildGuestSearchFilter(params.query, REGISTRATION_SEARCH_COLUMNS))
      .order("nama", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + GUEST_SEARCH_PAGE_SIZE - 1)
      .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]));

    if (error) throw error;

    const response: RegistrationSearchResponse = {
      registrations: (data ?? []).map((row) => ({
        id: row.id,
        nama: row.nama,
        perwakilan_bmh: row.perwakilan_bmh,
        jabatan: row.jabatan ?? null,
        departemen: row.departemen ?? null,
      })),
      total: count ?? 0,
      page: params.page,
      pageSize: GUEST_SEARCH_PAGE_SIZE,
    };
    return Response.json(response, { headers });
  } catch {
    return Response.json(
      { message: INVITED_GUESTS_CONTENT.errorDescription },
      { status: 503, headers },
    );
  }
}
