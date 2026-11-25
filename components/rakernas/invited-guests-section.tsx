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
} from "@/lib/guest-search";
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

type ResultCard = {
  id: string;
  nama: string;
  perwakilan_daerah: string;
  jabatan: string | null;
};

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

function ResultGroup({ title, cards, query }: { title: string; cards: ResultCard[]; query: string }) {
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
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-brand-green to-brand-green-deep text-base font-bold text-white shadow-sm"
                >
                  {initials(guest.nama)}
                </span>
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
  const acceptedCards: ResultCard[] = data?.guests ?? [];
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
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-5 md:px-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Badge variant="outline" className="gap-2 border-brand-green/30 bg-brand-green/15 px-3 py-1 text-brand-green-text">
          <UsersRound className="size-3.5" aria-hidden="true" />
          {copy.badge}
        </Badge>
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-brand-gold-soft md:text-4xl">
          {copy.title}
        </h2>
        <p className="text-sm leading-relaxed text-foreground/80 md:text-base">{copy.description}</p>
      </div>

      <Card className="relative mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 backdrop-blur-sm md:mt-8">
        <span
          aria-hidden="true"
          className="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-brand-gold/70 to-transparent"
        />
        <CardContent>
          <div role="search" className="space-y-3">
            <Label htmlFor="invited-guest-search" className="text-sm font-semibold text-foreground">
              {copy.searchLabel}
            </Label>
            <InputGroup className="h-14 rounded-xl border-0 bg-white shadow-sm ring-1 ring-white/20 transition-shadow has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-brand-gold/80">
              <InputGroupAddon className="pl-4 text-brand-green-deep">
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
                className="scroll-mt-40 h-14 min-w-0 text-base font-medium text-brand-green-night placeholder:font-normal placeholder:text-brand-green-deep/50 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <InputGroupAddon align="inline-end" className="pr-1.5">
                  <InputGroupButton
                    size="icon-sm"
                    className="size-11 rounded-lg text-brand-green-deep/70 hover:bg-brand-green/10 hover:text-brand-green-night"
                    aria-label={copy.clearLabel}
                    onClick={() => { changeQuery(""); inputRef.current?.focus(); }}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <p id="invited-guest-hint" className="text-xs leading-relaxed text-foreground/75 sm:text-sm">{copy.searchHint}</p>
          </div>
        </CardContent>
      </Card>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div id="invited-guest-results" className="mx-auto mt-8 max-w-6xl md:mt-12" aria-busy={loading}>
        {canSearch && (
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div className="min-w-0">
              <h3 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">{copy.detailsTitle}</h3>
              <p className="mt-0.5 wrap-anywhere text-sm text-foreground/70">
                Hasil untuk <span className="font-semibold text-brand-gold-soft">&ldquo;{normalizedQuery}&rdquo;</span>
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
                <p className="rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-foreground/85">
                  {copy.pageLabel(page, totalPages)}
                </p>
                <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
                  <Button
                    variant="outline"
                    className="h-12 border-white/25 bg-white/5 px-4 text-foreground hover:bg-white/15 hover:text-foreground disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    {copy.previousLabel}
                  </Button>
                  <Button
                    className="h-12 bg-brand-gold px-4 font-semibold text-brand-green-night hover:bg-brand-gold-soft disabled:opacity-40"
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
          <Card className="mx-auto max-w-3xl rounded-2xl border border-dashed border-white/20 bg-white/5 text-center shadow-none">
            <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-10">
              <span
                className={cn(
                  "flex size-14 items-center justify-center rounded-full ring-1",
                  failed
                    ? "bg-red-400/15 text-red-200 ring-red-300/30"
                    : "bg-brand-gold/15 text-brand-gold-soft ring-brand-gold/30",
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
              <h3 className="max-w-md font-heading text-lg font-semibold text-balance text-foreground">
                {failed ? copy.errorTitle : canSearch ? copy.emptyTitle : copy.initialTitle}
              </h3>
              <p className="max-w-xl text-sm leading-relaxed text-foreground/75">
                {failed ? copy.errorDescription : canSearch ? copy.emptyDescription : copy.initialDescription}
              </p>
              {failed && (
                <Button
                  className="mt-2 h-12 bg-brand-gold px-6 font-semibold text-brand-green-night hover:bg-brand-gold-soft"
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
