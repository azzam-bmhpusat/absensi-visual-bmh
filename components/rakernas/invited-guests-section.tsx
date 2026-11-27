"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  MapPin,
  Search,
  SearchX,
  TriangleAlert,
  UsersRound,
  X,
} from "lucide-react";
import { useLenis } from "lenis/react";
import { cn } from "cn";
import { INVITED_GUESTS_CONTENT as copy } from "@/content/rakernas";
import { normalizeString } from "@/lib/normalize";
import { scrollToElementWhenReady } from "@/lib/scroll-to-element";
import {
  GUEST_SEARCH_MAX_LENGTH,
  GUEST_SEARCH_MIN_LENGTH,
  type GuestSearchResponse,
  type PublicGuest,
} from "@/lib/guest-search";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type SearchResult =
  | {
      key: string;
      status: "success";
      data: GuestSearchResponse;
    }
  | { key: string; status: "error" };

const SEARCH_ANCHOR = "#invited-guest-search";

/** Dua huruf awal nama (kata pertama + kata terakhir) untuk avatar. */
function initials(nama: string) {
  const words = nama.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const last = words.length > 1 ? words[words.length - 1][0] : (words[0][1] ?? "");
  return (words[0][0] + last).toUpperCase();
}

/** Sorot bagian teks yang cocok dengan kata kunci (tidak peka huruf besar/kecil). */
function highlight(text: string, query: string) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded-[3px] bg-brand-gold/40 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const detailRows = [
  { field: "jabatan", icon: BriefcaseBusiness },
] as const;

/**
 * Kartu hasil terang di atas latar gelap section. display-theme menimpa token ink/muted/card
 * menjadi warna terang, jadi warna teks kartu memakai brand-green-* yang tidak ditimpa.
 */
const resultCard =
  "relative min-w-0 gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 text-brand-green-night shadow-lg shadow-black/25 ring-1 ring-white/10";

function ResultGroup({ title, cards, query }: { title: string; cards: PublicGuest[]; query: string }) {
  return (
    <section aria-label={title}>
      <h3 className="sr-only">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((guest) => (
          <Card
            key={guest.id}
            className={cn(
              resultCard,
              "transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
            )}
            role="article"
            aria-labelledby={`invited-guest-${guest.id}`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand-green via-brand-green to-brand-gold"
            />
            <CardHeader className="gap-3 px-5 pt-6 pb-4">
              <div className="flex items-start gap-3.5">
                <UserAvatar
                  src={guest.avatarUrl}
                  name={guest.nama}
                  initials={initials(guest.nama)}
                  className="size-12 bg-linear-to-br from-brand-green to-brand-green-deep text-base font-bold text-white shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <CardTitle>
                    <h4
                      id={`invited-guest-${guest.id}`}
                      className="wrap-anywhere text-[17px] leading-snug font-semibold text-brand-green-night"
                    >
                      {highlight(guest.nama, query)}
                    </h4>
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="mt-1.5 h-6 gap-1 border-brand-green/30 bg-brand-green/12 px-2 text-[11px] font-semibold text-brand-green-deep"
                  >
                    <BadgeCheck aria-hidden="true" className="size-3.5" />
                    {copy.statusAccepted}
                  </Badge>
                </div>
              </div>
              <p className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-brand-gold/15 px-2.5 py-1.5 text-sm font-medium text-brand-green-night ring-1 ring-brand-gold/40">
                <MapPin aria-hidden="true" className="size-4 shrink-0 text-brand-green-deep" />
                <span className="sr-only">{copy.fields.perwakilan_daerah}: </span>
                <span className="wrap-anywhere">{guest.perwakilan_daerah?.trim() || copy.missingValue}</span>
              </p>
            </CardHeader>
            <CardContent className="@container px-5 pb-5">
              <Separator className="mb-4 bg-brand-green-deep/10" />
              <dl className="grid gap-3 @md:grid-cols-2 @md:gap-4">
                {detailRows.map(({ field, icon: Icon }) => {
                  const value = guest[field]?.trim();
                  return (
                    <div key={field} className="flex min-w-0 gap-2.5">
                      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-green" />
                      <div className="min-w-0">
                        <dt className="text-[11px] font-semibold tracking-wide text-brand-green-deep/65 uppercase">
                          {copy.fields[field]}
                        </dt>
                        <dd
                          className={cn(
                            "mt-0.5 wrap-anywhere text-sm leading-snug",
                            value ? "font-medium text-brand-green-night" : "text-brand-green-deep/55 italic",
                          )}
                        >
                          {value || copy.missingValue}
                        </dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function InvitedGuestsSection() {
  const lenis = useLenis();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = normalizeString(query);
  const canSearch = normalizedQuery.length >= GUEST_SEARCH_MIN_LENGTH;
  const requestKey = JSON.stringify([normalizedQuery, page, retry]);
  const currentResult = result?.key === requestKey ? result : null;
  const loading = canSearch && currentResult === null;
  const data = canSearch && currentResult?.status === "success" ? currentResult.data : null;
  const failed = canSearch && currentResult?.status === "error";
  const guestPages = data ? Math.ceil(data.total / data.pageSize) : 0;
  const totalPages = Math.max(1, guestPages);
  const combinedTotal = data?.total ?? 0;
  const acceptedCards = data?.guests ?? [];
  const hasCards = acceptedCards.length > 0;

  // Tautan ke /#invited-guest-search: gulir & fokus ke kolom pencarian
  useEffect(() => {
    let stop = () => {};
    // Lenis (satu instance di layout (site)) bertahan antar halaman dan menahan scroll native;
    // helper mencoba ulang sampai kolom pencarian benar-benar berada di posisi (scroll-mt-40).
    const start = () => {
      stop();
      stop = scrollToElementWhenReady({
        lenis,
        getElement: () => inputRef.current,
        offset: 160,
        enabled: () => window.location.hash === SEARCH_ANCHOR,
        onReach: (el) => (el as HTMLInputElement).focus({ preventScroll: true }),
      });
    };
    start();
    window.addEventListener("hashchange", start);
    return () => {
      stop();
      window.removeEventListener("hashchange", start);
    };
  }, [lenis]);

  useEffect(() => {
    if (normalizedQuery.length < GUEST_SEARCH_MIN_LENGTH) return;
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: normalizedQuery, page: String(page) });
        const response = await fetch(`/api/guests/search?${params}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Guest search failed");
        const payload: GuestSearchResponse = await response.json();
        if (active) {
          setResult({ key: requestKey, status: "success", data: payload });
        }
      } catch {
        if (active) setResult({ key: requestKey, status: "error" });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedQuery, page, retry, requestKey]);

  const announcement = !canSearch ? copy.searchHint
    : loading ? copy.loading
    : failed ? copy.errorDescription
    : copy.resultsCount(combinedTotal);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
    // Repeating an earlier query must fetch fresh data rather than reuse old results.
    if (normalizeString(value) !== normalizedQuery) setResult(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 md:px-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center md:gap-3">
        <p className="text-[11px] font-semibold tracking-[2px] text-[#1E7F62] uppercase md:text-xs md:tracking-[2.4px]">
          {copy.badge}
        </p>
        <h2 className="font-heading text-[28px] font-bold text-primary md:text-[40px]">{copy.title}</h2>
        <p className="text-sm/[22px] text-[#4F7A72] md:text-base">{copy.description}</p>
      </div>

      <div role="search" className="mx-auto mt-6 max-w-[720px] md:mt-8">
        <Label htmlFor="invited-guest-search" className="sr-only">
          {copy.searchLabel}
        </Label>
        <InputGroup className="h-12 rounded-2xl border border-[#DCE8E5] bg-white shadow-[0_8px_24px_#04362F0F] transition-shadow has-[input:focus-visible]:border-primary/40 has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-brand-gold/40 md:h-[52px]">
          <InputGroupAddon className="pl-4 text-[#4F7A72]">
            <Search className="size-5" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            ref={inputRef}
            id="invited-guest-search"
            type="search"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            maxLength={GUEST_SEARCH_MAX_LENGTH}
            autoComplete="off"
            aria-describedby="invited-guest-hint"
            aria-controls="invited-guest-results"
            className="scroll-mt-40 h-full min-w-0 text-base text-[#073B33] placeholder:text-[#4F7A72] [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <InputGroupAddon align="inline-end" className="pr-1.5">
              <InputGroupButton
                size="icon-sm"
                className="size-11 rounded-lg text-[#4F7A72] hover:bg-secondary hover:text-primary"
                aria-label={copy.clearLabel}
                onClick={() => { changeQuery(""); inputRef.current?.focus(); }}
              >
                <X className="size-4" aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <p id="invited-guest-hint" className="sr-only">{copy.searchHint}</p>
      </div>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div id="invited-guest-results" className="mx-auto mt-8 max-w-6xl md:mt-12" aria-busy={loading}>
        {canSearch && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h3 className="font-heading text-xl font-semibold text-primary sm:text-2xl">{copy.detailsTitle}</h3>
              <p className="mt-0.5 wrap-anywhere text-sm text-[#4F7A72]">
                Hasil untuk <span className="font-semibold text-[#9A6A12]">&ldquo;{normalizedQuery}&rdquo;</span>
              </p>
            </div>
            {data && (
              <Badge className="h-7 border-0 bg-brand-gold px-3 text-xs font-semibold text-brand-green-night">
                {copy.resultsCount(combinedTotal)}
              </Badge>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((index) => (
              <Card key={index} className={cn(resultCard, index === 2 && "hidden xl:flex")}>
                <CardContent className="space-y-4 px-5 py-6">
                  <div className="flex items-center gap-3.5">
                    <Skeleton className="size-12 rounded-full bg-brand-green/15" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4 bg-brand-green/15" />
                      <Skeleton className="h-4 w-1/3 bg-brand-green/10" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-1/2 rounded-lg bg-brand-gold/20" />
                  <div className="grid grid-cols-2 gap-4 border-t border-brand-green-deep/10 pt-4">
                    <Skeleton className="h-9 bg-brand-green/10" />
                    <Skeleton className="h-9 bg-brand-green/10" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && hasCards ? (
          <>
            <ResultGroup title={copy.acceptedGroupTitle} cards={acceptedCards} query={normalizedQuery} />
            {totalPages > 1 && (
              <nav
                className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
                aria-label={copy.paginationLabel}
              >
                <p className="rounded-full bg-white px-3 py-1 text-sm font-medium text-[#073B33] ring-1 ring-[#DCE8E5]">
                  {copy.pageLabel(page, totalPages)}
                </p>
                <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-12 border-[#DCE8E5] bg-white px-4 text-primary hover:bg-secondary hover:text-primary disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {copy.previousLabel}
                  </Button>
                  <Button
                    className="h-12 bg-primary px-4 font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    {copy.nextLabel}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </nav>
            )}
          </>
        ) : (
          <Card className="mx-auto max-w-[720px] rounded-none border-0 bg-transparent text-center shadow-none ring-0">
            <CardContent className="flex flex-col items-center justify-center gap-3 px-0 py-2 md:px-6">
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-full ring-1",
                  failed
                    ? "bg-red-50 text-red-700 ring-red-200"
                    : "bg-[#DFF3EA] text-primary ring-transparent",
                )}
              >
                {failed ? (
                  <TriangleAlert className="size-7" aria-hidden="true" />
                ) : canSearch ? (
                  <SearchX className="size-7" aria-hidden="true" />
                ) : (
                  <UsersRound className="size-7" aria-hidden="true" />
                )}
              </span>
              <h3 className="hidden max-w-md font-heading text-lg font-semibold text-balance text-primary md:block">
                {failed ? copy.errorTitle : canSearch ? copy.emptyTitle : copy.initialTitle}
              </h3>
              <p className="max-w-xl text-sm/[22px] text-[#4F7A72] md:text-[15px]">
                {failed ? copy.errorDescription : canSearch ? copy.emptyDescription : copy.initialDescription}
              </p>
              {failed && (
                <Button
                  className="mt-2 h-12 bg-primary px-6 font-semibold text-white hover:bg-primary/90"
                  onClick={() => setRetry(retry + 1)}
                >
                  {copy.retryLabel}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
