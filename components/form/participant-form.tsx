"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, CircleAlert, KeyRound, Loader2, LogIn, Mail, MapPinned, RefreshCw, Search, Send, X } from "lucide-react";
import { cn } from "cn";
import {
  loadParticipant,
  submitParticipantForm,
  type SubmitParticipantResult,
} from "@/app/(site)/form/actions";
import { ProfileFields, SubmitBar, useMissingFields, type ProfileInitial } from "@/components/profile/profile-form";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { savePrefillPassword } from "@/components/auth/login-form";

export interface ParticipantOption {
  id: string;
  nama: string;
  perwakilan_daerah: string | null;
  /** Profil sudah lengkap: dikunci dari /form (tidak bisa dipilih lagi). */
  complete: boolean;
}

/**
 * Kolom "Cari nama atau daerah perwakilan BMH" langsung di formulir (bukan dropdown).
 * Pencarian mencocokkan nama peserta atau perwakilan daerah; hasilnya tampil di bawah kolom
 * dan peserta memilih namanya dari daftar itu.
 */
function ParticipantPicker({
  participants,
  selected,
  onSelect,
  onClear,
  disabled,
}: {
  participants: ParticipantOption[];
  selected: ParticipantOption | null;
  onSelect: (p: ParticipantOption) => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const results = q
    ? participants.filter(
        (p) => p.nama.toLowerCase().includes(q) || (p.perwakilan_daerah ?? "").toLowerCase().includes(q)
      )
    : [];

  if (selected) {
    return (
      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-ink">Peserta dipilih</p>
        <div className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-primary bg-secondary px-3.5 py-2.5">
          <Check className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{selected.nama}</span>
            <span className="flex items-center gap-1 truncate text-xs text-ink-muted">
              <MapPinned className="size-3.5 shrink-0" aria-hidden="true" />
              {selected.perwakilan_daerah}
            </span>
          </span>
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-semibold text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Ganti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="region-search" className="text-[13px] font-semibold text-ink">
          Cari nama atau daerah perwakilan BMH
        </Label>
        <InputGroup className="h-12 rounded-xl border-line bg-white has-[input:focus-visible]:border-primary has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-primary/15">
          <InputGroupAddon className="pl-3.5 text-ink-muted">
            <Search className="size-[18px]" aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id="region-search"
            type="text"
            inputMode="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Contoh: Ahmad atau Jawa Timur"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-controls="region-results"
            aria-describedby="region-search-hint"
            disabled={disabled}
            className="h-12 text-[15px] text-ink"
          />
          {search && (
            <InputGroupAddon align="inline-end" className="pr-2">
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Hapus pencarian"
                className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </InputGroupAddon>
          )}
        </InputGroup>
        <p id="region-search-hint" className="text-xs text-ink-muted">
          Ketik nama Anda atau daerah perwakilan, lalu pilih nama Anda dari hasil di bawah.
        </p>
      </div>

      <div id="region-results" aria-live="polite">
        {q && results.length === 0 && (
          <p className="flex items-start gap-2 rounded-xl border border-dashed border-line bg-surface p-3.5 text-sm text-ink-muted">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-brand-gold-text" aria-hidden="true" />
            Nama atau daerah perwakilan tidak ditemukan. Coba ketik nama Anda atau daerah perwakilan BMH, contoh: Jawa Timur.
          </p>
        )}
        {results.length > 0 && (
          <>
            <p className="mb-2 text-xs font-medium text-ink-muted">
              {results.length} peserta ditemukan, pilih nama Anda:
            </p>
            {results.some((p) => p.complete) && (
              <p className="mb-2 text-xs text-ink-muted">
                Nama bertanda <span className="font-semibold text-primary">Sudah diisi</span> tidak bisa diisi ulang di
                sini. Untuk mengubah data, masuk lalu buka halaman Profil.
              </p>
            )}
            <ul data-lenis-prevent className="max-h-80 space-y-1.5 overflow-y-auto">
              {results.map((p) => {
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(p)}
                      disabled={disabled || p.complete}
                      className={cn(
                        "flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
                        p.complete && "border-dashed bg-surface hover:border-line hover:bg-surface"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">{p.nama}</span>
                        <span className="flex items-center gap-1 truncate text-xs text-ink-muted">
                          <MapPinned className="size-3.5 shrink-0" aria-hidden="true" />
                          {p.perwakilan_daerah}
                        </span>
                      </span>
                      {p.complete && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                          Sudah diisi
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessDialog({ email, password }: { email: string; password: string }) {
  return (
    <Dialog open onOpenChange={() => {}} disablePointerDismissal>
      <DialogContent showCloseButton={false} className="gap-5 p-6 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <CheckCircle2 className="size-8" aria-hidden="true" />
          </span>
          <DialogTitle className="font-heading text-lg font-bold text-primary">Data Berhasil Terkirim</DialogTitle>
          <DialogDescription>
            Terima kasih. Gunakan akun berikut untuk masuk dan mengakses informasi Rakernas.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-3 rounded-2xl border border-line bg-surface p-4 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <dt className="w-24 shrink-0 text-ink-muted">Email</dt>
            <dd className="min-w-0 wrap-anywhere font-semibold text-ink">{email}</dd>
          </div>
          <div className="flex items-center gap-3">
            <KeyRound className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <dt className="w-24 shrink-0 text-ink-muted">Kata sandi</dt>
            <dd className="font-mono font-semibold text-ink">{password}</dd>
          </div>
        </dl>
        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Link
            href={`/login?email=${encodeURIComponent(email)}`}
            onClick={() => savePrefillPassword(password)}
            className={cn(buttonVariants(), "h-11 w-full rounded-xl bg-primary font-semibold text-white hover:bg-brand-green-deep")}
          >
            <LogIn className="size-4" aria-hidden="true" />
            Masuk untuk Akses Informasi Rakernas
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ParticipantForm({
  participants,
  loginPassword,
}: {
  participants: ParticipantOption[];
  loginPassword: string;
}) {
  const [selected, setSelected] = useState<ParticipantOption | null>(null);
  const [initial, setInitial] = useState<ProfileInitial | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [state, formAction, isPending] = useActionState<SubmitParticipantResult | null, FormData>(
    submitParticipantForm,
    null
  );
  const { missing, formProps } = useMissingFields();

  function handleSelect(p: ParticipantOption) {
    setSelected(p);
    setInitial(null);
    setLoadError(null);
    startLoading(async () => {
      const res = await loadParticipant(p.id);
      if (res.success) setInitial(res.initial);
      else setLoadError(res.error);
    });
  }

  function handleClear() {
    setSelected(null);
    setInitial(null);
    setLoadError(null);
  }

  return (
    <div className="rounded-3xl border border-line bg-white shadow-sm">
      <section className="border-b border-line px-5 py-6 sm:px-7" aria-labelledby="form-step-1">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            1
          </span>
          <div>
            <h2 id="form-step-1" className="font-heading text-base font-semibold text-primary">
              Nama Peserta
            </h2>
            <p className="text-sm text-ink-muted">Cari nama atau daerah perwakilan Anda, lalu pilih nama Anda.</p>
          </div>
        </div>
        <div
          role="note"
          className="mb-3 flex gap-3 rounded-2xl border border-brand-gold/50 bg-gold-50 p-3.5 text-sm text-ink"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-brand-gold-text" aria-hidden="true" />
          <p>
            <span className="font-semibold">Cari dengan nama Anda atau daerah perwakilan BMH.</span> Contoh:{" "}
            <span className="font-semibold">Ahmad</span> atau <span className="font-semibold">Jawa Timur</span>.
          </p>
        </div>
        <ParticipantPicker
          participants={participants}
          selected={selected}
          onSelect={handleSelect}
          onClear={handleClear}
          disabled={isPending}
        />
        {isLoading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Memuat data peserta...
          </p>
        )}
        {loadError && (
          <p role="alert" className="mt-3 text-sm text-danger">
            {loadError}
          </p>
        )}
      </section>

      {selected && initial && !isLoading && (
        <form action={formAction} key={selected.id} {...formProps}>
          <input type="hidden" name="id" value={selected.id} />
          <ProfileFields
            initial={initial}
            isPending={isPending}
            firstStep={2}
            jabatanEditable
            lockedEmail={initial.email}
            missing={missing}
          />
          <SubmitBar
            error={state?.success ? undefined : state?.error}
            isPending={isPending}
            hint="Semua data wajib diisi sebelum dikirim."
            label="Kirim Data"
            pendingLabel="Mengirim..."
            icon={Send}
          />
        </form>
      )}

      {state?.success && state.email && <SuccessDialog email={state.email} password={loginPassword} />}
    </div>
  );
}
