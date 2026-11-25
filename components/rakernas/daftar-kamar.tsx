"use client";

import { useDeferredValue, useState } from "react";
import { BedDouble, Search, User, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { Kamar } from "@/lib/content/schema";

const inisial = (nama: string) =>
  nama
    .split(" ")
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase();

/** Grid kartu kamar dengan pencarian nama peserta. */
export function DaftarKamar({ kamar }: { kamar: Kamar[] }) {
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query).trim().toLowerCase();

  const hasil = q
    ? kamar.filter((k) => k.penghuni.some((p) => p.nama.toLowerCase().includes(q)))
    : kamar;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="h-11 bg-white sm:max-w-sm dark:bg-card">
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama peserta"
            aria-label="Cari nama peserta"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" onClick={() => setQuery("")} aria-label="Hapus pencarian">
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {hasil.length} dari {kamar.length} kamar
        </p>
      </div>

      {hasil.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <Search className="mx-auto size-8 text-muted-foreground" aria-hidden />
          <p className="mt-3 font-medium">Peserta tidak ditemukan</p>
          <p className="text-sm text-muted-foreground">
            Tidak ada peserta dengan nama &ldquo;{query.trim()}&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hasil.map((k) => (
            <li
              key={k.nomor}
              className="flex flex-col overflow-hidden rounded-2xl border border-line bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-card/60"
            >
              <div className="relative isolate flex items-center justify-between gap-3 overflow-hidden bg-brand-green-deep px-5 py-4 text-white">
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-14 -z-10 w-16 bg-brand-gold-soft/90 [clip-path:polygon(55%_0,100%_0,45%_100%,0_100%)]"
                />
                <span
                  aria-hidden
                  className="absolute inset-y-0 right-8 -z-10 w-10 bg-brand-gold-soft/35 [clip-path:polygon(70%_0,100%_0,30%_100%,0_100%)]"
                />
                <div>
                  <p className="text-xs text-white/70">Kamar</p>
                  <p className="text-3xl font-bold tracking-tight tabular-nums">{k.nomor}</p>
                </div>
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/15">
                  <BedDouble className="size-5" aria-hidden />
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <User aria-hidden /> {k.penghuni.length} Peserta
                  </Badge>
                  <Badge variant="outline">Lantai {k.lantai}</Badge>
                </div>

                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Penghuni
                </p>
                <ul className="space-y-3">
                  {k.penghuni.map((p) => {
                    const cocok = q !== "" && p.nama.toLowerCase().includes(q);
                    return (
                      <li
                        key={p.nama}
                        className={
                          "flex items-center gap-3 rounded-xl p-1.5 -m-1.5 " +
                          (cocok ? "bg-brand-gold-soft/25" : "")
                        }
                      >
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-sm font-semibold text-brand-green-deep dark:text-brand-gold-soft"
                        >
                          {inisial(p.nama)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.nama}</span>
                          <span className="block truncate text-sm text-muted-foreground">
                            {p.wilayah}
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
