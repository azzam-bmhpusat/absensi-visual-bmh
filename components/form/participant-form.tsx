"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, ChevronsUpDown, KeyRound, Loader2, LogIn, Mail, Send, UserSearch } from "lucide-react";
import { cn } from "cn";
import {
  loadParticipant,
  submitParticipantForm,
  type SubmitParticipantResult,
} from "@/app/(site)/form/actions";
import { ProfileFields, SubmitBar, type ProfileInitial } from "@/components/profile/profile-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";

export interface ParticipantOption {
  id: string;
  nama: string;
  perwakilan_daerah: string | null;
}

function ParticipantPicker({
  participants,
  selected,
  onSelect,
  disabled,
}: {
  participants: ParticipantOption[];
  selected: ParticipantOption | null;
  onSelect: (p: ParticipantOption) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const filtered = q
    ? participants.filter(
        (p) => p.nama.toLowerCase().includes(q) || (p.perwakilan_daerah ?? "").toLowerCase().includes(q)
      )
    : participants;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id="participant-picker"
        disabled={disabled}
        className={cn(
          "flex h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 text-left text-[15px] transition-colors focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          !selected && "text-ink-muted"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <UserSearch className="size-[18px] shrink-0 text-ink-muted" aria-hidden="true" />
          <span className="truncate">{selected ? selected.nama : "Pilih nama peserta..."}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) min-w-72 rounded-xl border-line p-0 shadow-lg" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Cari nama peserta..." value={search} onValueChange={setSearch} />
          <CommandList data-lenis-prevent className="max-h-72 overflow-y-auto">
            <CommandEmpty className="py-4 text-center text-sm text-ink-muted">Nama tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {filtered.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.id}
                  onSelect={() => {
                    onSelect(p);
                    setSearch("");
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5"
                >
                  <span className="flex min-w-0 flex-col text-left">
                    <span className="truncate text-sm font-medium text-ink">{p.nama}</span>
                    {p.perwakilan_daerah && <span className="truncate text-xs text-ink-muted">{p.perwakilan_daerah}</span>}
                  </span>
                  {selected?.id === p.id && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
  const [initial, setInitial] = useState<Omit<ProfileInitial, "email"> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoading] = useTransition();
  const [state, formAction, isPending] = useActionState<SubmitParticipantResult | null, FormData>(
    submitParticipantForm,
    null
  );

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
            <p className="text-sm text-ink-muted">Cari dan pilih nama Anda dari daftar peserta.</p>
          </div>
        </div>
        <label htmlFor="participant-picker" className="sr-only">
          Nama peserta
        </label>
        <ParticipantPicker
          participants={participants}
          selected={selected}
          onSelect={handleSelect}
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
        <form action={formAction} key={selected.id}>
          <input type="hidden" name="id" value={selected.id} />
          <ProfileFields initial={initial} isPending={isPending} firstStep={2} jabatanEditable />
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
