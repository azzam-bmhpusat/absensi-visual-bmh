import { normalizeString } from "@/lib/normalize";

export const GUEST_SEARCH_PAGE_SIZE = 10;
export const GUEST_SEARCH_MIN_LENGTH = 2;
export const GUEST_SEARCH_MAX_LENGTH = 100;

export interface PublicGuest {
  id: string;
  nama: string;
  perwakilan_daerah: string;
  jabatan: string | null;
}

export interface GuestSearchResponse {
  guests: PublicGuest[];
  total: number;
  page: number;
  pageSize: number;
}

export function parseGuestSearchParams(params: URLSearchParams) {
  const query = normalizeString(params.get("q") ?? "");
  const rawPage = params.get("page") ?? "1";
  const page = Number(rawPage);
  if (
    query.length < GUEST_SEARCH_MIN_LENGTH ||
    query.length > GUEST_SEARCH_MAX_LENGTH ||
    Array.from(query).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    !/^\d+$/.test(rawPage) ||
    !Number.isSafeInteger(page) || page < 1 ||
    !Number.isSafeInteger(page * GUEST_SEARCH_PAGE_SIZE)
  ) return null;
  return { query, page };
}

const GUEST_SEARCH_COLUMNS = ["nama", "perwakilan_daerah", "jabatan"] as const;

export function buildGuestSearchFilter(
  query: string,
  columns: readonly string[] = GUEST_SEARCH_COLUMNS
) {
  // PostgREST treats '*' as a LIKE wildcard even inside quoted values.
  // A literal regular expression preserves searches containing an actual '*'.
  const hasAsterisk = query.includes("*");
  const operator = hasAsterisk ? "imatch" : "ilike";
  const pattern = hasAsterisk
    ? query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    : `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  // Quote the value for PostgREST grammar; the SDK handles URL encoding.
  const value = JSON.stringify(pattern);
  return columns
    .map((column) => `${column}.${operator}.${value}`)
    .join(",");
}
