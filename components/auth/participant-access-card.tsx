import { LockKeyhole, LogIn, MessageCircle, ShieldCheck } from "lucide-react";
import { logoutUser } from "@/app/(site)/login/actions";

export interface ParticipantAccessAccount {
  email: string;
  name: string;
  isNonParticipant: boolean;
  isGoogle: boolean;
}

export interface ParticipantAccessCardProps {
  account: ParticipantAccessAccount | null;
  contactUrl: string;
}

/** Kartu akses dirender di server; data akun tidak diteruskan ke komponen client. */
export function ParticipantAccessCard({ account, contactUrl }: ParticipantAccessCardProps) {
  const googleNonParticipant = account?.isGoogle && account.isNonParticipant;
  const initials = account
    ? (account.name || account.email.split("@")[0]).trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase() || "?"
    : "";
  const steps = [
    account ? (account.isGoogle ? "Keluar dari akun Google ini" : "Keluar dari akun ini") : "Siapkan akun BMH dari panitia",
    "Masuk dengan email & kata sandi BMH",
    "Lengkapi profil peserta Anda",
  ];

  return (
    <section aria-labelledby="participant-access-title" className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-5 rounded-[28px] border border-white/70 bg-linear-to-b from-white/90 to-white/80 p-6 text-ink shadow-[0_24px_60px_#0003,inset_0_1px_0_#ffffffe6] backdrop-blur-[20px] lg:p-10">
      <span aria-hidden="true" className="flex size-[84px] shrink-0 items-center justify-center rounded-full bg-brand-gold/15">
        <span className="flex size-[60px] items-center justify-center rounded-full bg-linear-to-b from-brand-gold-soft to-brand-gold shadow-[0_8px_20px_color-mix(in_srgb,var(--brand-gold)_40%,transparent)]">
          <LockKeyhole className="size-7 text-brand-green-night" />
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-gold-50 px-3 py-[5px] text-[11px] font-bold text-brand-gold-text">
        <ShieldCheck aria-hidden="true" className="size-[13px]" />
        AKSES TERBATAS
      </span>
      <h1 id="participant-access-title" className="w-full text-center font-heading text-2xl/[1.2] font-bold text-brand-green-deep lg:text-[30px]/[1.2]">
        Khusus Peserta Rakernas 2027
      </h1>
      <p className="w-full text-center text-[15px]/[1.6] text-ink-muted">
        {googleNonParticipant ? "Akun Google Anda belum terdaftar sebagai peserta. " : account?.isNonParticipant ? "Akun Anda belum terdaftar sebagai peserta. " : ""}
        Masuk dengan akun BMH (@bmh.or.id) yang diberikan panitia untuk mengakses halaman ini.
      </p>
      {account && (
        <div aria-label="Akun aktif" className="flex w-full min-w-0 flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 font-heading text-sm font-bold text-brand-green-text">{initials}</span>
          <div className="min-w-0 flex-1 basis-[130px]">
            <p className="text-[11px] text-ink-muted">Masuk sebagai</p>
            <p className="wrap-anywhere text-sm font-semibold text-ink">{account.email || "Akun aktif"}</p>
          </div>
          {account.isNonParticipant && <span className="shrink-0 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-semibold text-brand-gold-text">Bukan peserta</span>}
        </div>
      )}
      <ol aria-label="Langkah masuk dengan akun BMH" className="flex w-full flex-col gap-2.5 text-sm">
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-brand-green-text">{index + 1}</span>
            <span className="min-w-0 flex-1">{step}</span>
          </li>
        ))}
      </ol>
      <form action={logoutUser} className="w-full">
        <button type="submit" className="flex min-h-[50px] w-full cursor-pointer items-center justify-between gap-3 rounded-full border border-white/35 bg-linear-to-b from-brand-green-deep to-brand-green-night py-1.5 pr-1.5 pl-6 text-left text-[15px] font-semibold text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--brand-green-deep)_25%,transparent),inset_0_1px_0_#fff3] transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold">
          <span>Masuk dengan Akun BMH</span>
          <span aria-hidden="true" className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-green-night"><LogIn className="size-[18px]" /></span>
        </button>
      </form>
      <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center justify-center gap-1.5 rounded-sm text-center text-[13px]/[1.5] text-ink-muted underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <MessageCircle aria-hidden="true" className="size-3.5 shrink-0" />
        <span>Belum punya akun BMH? <span className="font-medium">Hubungi panitia</span></span>
      </a>
    </section>
  );
}
