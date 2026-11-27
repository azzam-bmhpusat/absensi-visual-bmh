import { INVITED_GUESTS_CONTENT } from "@/content/rakernas";
import { avatarPublicUrl } from "@/lib/avatar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicServerClient } from "@/lib/supabase/server";
import {
  buildGuestSearchFilter,
  GUEST_SEARCH_PAGE_SIZE,
  parseGuestSearchParams,
  type GuestSearchResponse,
} from "@/lib/guest-search";

const headers = { "Cache-Control": "no-store" };

async function getGuestAvatars(ids: string[], signal: AbortSignal) {
  const avatars = new Map<string, string | null>();
  if (ids.length === 0) return avatars;

  try {
    const { data, error } = await createAdminClient()
      .from("profiles")
      .select("id, avatar_url")
      .in("id", ids)
      .not("nama", "is", null)
      .abortSignal(AbortSignal.any([signal, AbortSignal.timeout(2_500)]));

    if (!error) {
      for (const profile of data ?? []) {
        avatars.set(profile.id, avatarPublicUrl(profile.avatar_url));
      }
    }
  } catch {
    // A missing avatar should not prevent the search results from loading.
  }
  return avatars;
}

export async function GET(request: Request) {
  const params = parseGuestSearchParams(new URL(request.url).searchParams);
  if (!params) {
    return Response.json({ message: INVITED_GUESTS_CONTENT.invalidRequest }, { status: 400, headers });
  }

  try {
    const supabase = createPublicServerClient();
    const start = (params.page - 1) * GUEST_SEARCH_PAGE_SIZE;
    const { data, count, error } = await supabase
      .from("profiles")
      .select("id, nama, perwakilan_daerah, jabatan", { count: "exact" })
      .not("nama", "is", null)
      .or(buildGuestSearchFilter(params.query))
      .order("nama", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + GUEST_SEARCH_PAGE_SIZE - 1)
      .abortSignal(AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]));

    if (error) throw error;

    const guests = data ?? [];
    const avatars = await getGuestAvatars(guests.map((guest) => guest.id), request.signal);
    const response: GuestSearchResponse = {
      guests: guests.map((guest) => ({
        id: guest.id,
        nama: guest.nama,
        perwakilan_daerah: guest.perwakilan_daerah,
        jabatan: guest.jabatan ?? null,
        avatarUrl: avatars.get(guest.id) ?? null,
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
