"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Search, UsersRound, X } from "lucide-react";
import { INVITED_GUESTS_CONTENT as copy } from "@/content/rakernas";
import { normalizeString } from "@/lib/normalize";
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
  | { key: string; status: "success"; data: GuestSearchResponse }
  | { key: string; status: "error" };

const detailFields = ["perwakilan_daerah", "jabatan", "departemen"] as const;

export function InvitedGuestsSection() {
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
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

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
        if (active) setResult({ key: requestKey, status: "success", data: payload });
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
    : copy.resultsCount(data?.total ?? 0);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
    // Repeating an earlier query must fetch fresh data rather than reuse old results.
    if (normalizeString(value) !== normalizedQuery) setResult(null);
  }

  return (
    <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <Badge variant="outline" className="gap-2 border-brand-green/25 bg-brand-green/15 px-3 py-1 text-brand-green">
          <UsersRound className="size-3.5" aria-hidden="true" />
          {copy.badge}
        </Badge>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-brand-gold-soft md:text-4xl">
          {copy.title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{copy.description}</p>
      </div>

      <Card className="mx-auto mt-8 max-w-3xl rounded-2xl border-border bg-card/80 shadow-sm md:mt-10">
        <CardContent>
          <div role="search" className="space-y-3">
            <Label htmlFor="invited-guest-search" className="text-sm font-medium text-foreground">{copy.searchLabel}</Label>
            <InputGroup className="h-13 rounded-xl border-border bg-background/40">
              <InputGroupAddon className="pl-4 text-muted-foreground">
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
                className="h-13 min-w-0 text-base text-foreground placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <InputGroupAddon align="inline-end" className="pr-1">
                  <InputGroupButton
                    size="icon-sm"
                    className="size-11 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                    aria-label={copy.clearLabel}
                    onClick={() => { changeQuery(""); inputRef.current?.focus(); }}
                  >
                    <X className="size-4" aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <p id="invited-guest-hint" className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{copy.searchHint}</p>
          </div>
        </CardContent>
      </Card>

      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div id="invited-guest-results" className="mx-auto mt-8 max-w-5xl" aria-busy={loading}>
        {canSearch && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold text-foreground sm:text-xl">{copy.detailsTitle}</h3>
            {data && <Badge variant="secondary" className="border-border px-3 py-1 text-xs">{copy.resultsCount(data.total)}</Badge>}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2" aria-hidden="true">
            {[0, 1].map((index) => (
              <Card key={index} className="rounded-2xl border-border bg-card/60">
                <CardContent className="space-y-5">
                  <Skeleton className="h-6 w-2/3 bg-secondary" />
                  <Skeleton className="h-4 w-full bg-secondary" />
                  <Skeleton className="h-4 w-4/5 bg-secondary" />
                  <Skeleton className="h-4 w-1/2 bg-secondary" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data && data.guests.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {data.guests.map((guest) => (
                <Card key={guest.id} className="min-w-0 rounded-2xl border-border bg-card/80" role="article" aria-labelledby={`invited-guest-${guest.id}`}>
                  <CardHeader>
                    <p className="text-xs font-medium text-muted-foreground">{copy.fields.nama}</p>
                    <CardTitle>
                      <h4 id={`invited-guest-${guest.id}`} className="wrap-anywhere text-lg font-semibold text-foreground">{guest.nama}</h4>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-5 bg-border" />
                    <dl className="space-y-4">
                      {detailFields.map((field) => (
                        <div key={field} className="space-y-1">
                          <dt className="text-xs text-muted-foreground">{copy.fields[field]}</dt>
                          <dd className="wrap-anywhere text-sm font-medium leading-relaxed text-foreground">{guest[field]?.trim() || copy.missingValue}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
            {totalPages > 1 && (
              <nav className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:justify-between" aria-label={copy.paginationLabel}>
                <p className="w-full text-center text-sm text-muted-foreground sm:w-auto sm:text-left">{copy.pageLabel(page, totalPages)}</p>
                <div className="flex gap-3">
                  <Button variant="secondary" className="h-12 px-4" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ArrowLeft className="size-4" aria-hidden="true" />{copy.previousLabel}
                  </Button>
                  <Button variant="secondary" className="h-12 px-4" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    {copy.nextLabel}<ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </nav>
            )}
          </>
        ) : (
          <Card className="rounded-2xl border-border bg-card/40 text-center shadow-none">
            <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 py-8">
              <UsersRound className="size-8 text-brand-green" aria-hidden="true" />
              <h3 className="font-heading text-base font-semibold text-foreground">{failed ? copy.errorTitle : canSearch ? copy.emptyTitle : copy.initialTitle}</h3>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{failed ? copy.errorDescription : canSearch ? copy.emptyDescription : copy.initialDescription}</p>
              {failed && <Button variant="secondary" className="mt-1 h-12 px-5" onClick={() => setRetry(retry + 1)}>{copy.retryLabel}</Button>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
