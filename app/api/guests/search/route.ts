import { INVITED_GUESTS_CONTENT } from "@/content/rakernas";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  buildGuestSearchFilter,
  GUEST_SEARCH_PAGE_SIZE,
  parseGuestSearchParams,
  type GuestSearchResponse,
} from "@/lib/guest-search";

const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = parseGuestSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return Response.json({ message: INVITED_GUESTS_CONTENT.invalidRequest }, { status: 400, headers });
  }

  try {
    const supabase = createPublicServerClient();
    const start = (params.page - 1) * GUEST_SEARCH_PAGE_SIZE;
    const { data, count, error } = await supabase
      .from("guests")
      .select("id, nama, perwakilan_daerah, jabatan, departemen", { count: "exact" })
      .or(buildGuestSearchFilter(params.query))
      .order("nama", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + GUEST_SEARCH_PAGE_SIZE - 1)
      .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]));

    if (error) throw error;

    const response: GuestSearchResponse = {
      guests: (data ?? []).map((guest) => ({
        id: guest.id,
        nama: guest.nama,
        perwakilan_daerah: guest.perwakilan_daerah,
        jabatan: guest.jabatan ?? null,
        departemen: guest.departemen ?? null,
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
