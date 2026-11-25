import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BadgeCheck, CalendarClock, CircleAlert, MapPin, Phone, Shirt, UserPlus, Video, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PublicFooter } from "@/components/rakernas/public-page";
import { ProfileForm } from "@/components/profile/profile-form";
import { formatArrival, isoToWibLocal, isProfileComplete, profileStatus } from "@/lib/profile-contact";
import { MODE_KEHADIRAN_LABEL } from "@/lib/participant-options";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { avatarPublicUrl } from "@/lib/avatar";
import { toUserRole } from "@/lib/user-schema";
import { FOOTER_DATA } from "@/content/rakernas";
import { buttonVariants } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

export const metadata: Metadata = {
  title: "Profil Saya",
  robots: { index: false, follow: false },
};

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | null }) {
  return (
    <li className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        <p className={cn("wrap-anywhere text-sm", value ? "font-semibold text-ink" : "text-ink-muted italic")}>
          {value || "Belum diisi"}
        </p>
      </div>
    </li>
  );
}

async function ProfileContent() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fprofile");

  // Kolom no_whatsapp / rencana_kedatangan privat: dibaca server-side untuk akun sendiri saja.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, nama, nama_google, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  // Role `user` (akun Google baru) belum peserta: tanpa form, hanya ajakan menghubungi panitia.
  const isApplicant = toUserRole(profile?.role) === "user";
  const complete = isProfileComplete(profile);
  // Peserta dengan profil lengkap: form hanya dibaca (updateProfile juga menolak).
  const locked = toUserRole(profile?.role) === "peserta" && complete;
  const { filled, total } = profileStatus(profile);
  const percent = Math.round((filled / total) * 100);
  // Akun dari Google: nama Google (privat) hanya sebagai sapaan; tidak pernah menjadi `nama` publik.
  const googleName = profile?.nama_google?.trim() || "";
  const displayName = profile?.nama?.trim() || googleName || "Peserta Rakernas";
  const subtitle = [profile?.jabatan?.trim(), profile?.perwakilan_daerah?.trim()].filter(Boolean).join(" · ");
  const mode = profile?.keterangan_kehadiran as keyof typeof MODE_KEHADIRAN_LABEL | null | undefined;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Hero profil */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-brand-green-deep to-brand-green-night px-5 py-8 text-white shadow-lg shadow-brand-green-deep/20 sm:px-8 md:py-10">
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-brand-green via-brand-gold to-brand-green" />
        <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-brand-green/25 blur-3xl" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 size-64 rounded-full bg-brand-gold/15 blur-3xl" />

        <div className="relative flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:text-left">
          <AvatarUpload src={avatarPublicUrl(profile?.avatar_url)} name={profile?.nama || user.email || ""} />

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-gold-soft uppercase">Profil Saya</p>
            <h1 className="mt-1 wrap-anywhere font-heading text-2xl font-bold text-balance sm:text-3xl">{displayName}</h1>
            {subtitle && <p className="mt-1 wrap-anywhere text-sm text-white/80 sm:text-base">{subtitle}</p>}
            {user.email && <p className="mt-1 wrap-anywhere text-sm text-white/60">{user.email}</p>}
          </div>

          {isApplicant ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-3 py-1.5 text-xs font-semibold text-brand-green-night">
              <CircleAlert className="size-3.5" aria-hidden="true" />
              Belum terdaftar sebagai peserta
            </span>
          ) : (
            <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 text-left ring-1 ring-white/15 backdrop-blur-sm md:w-64">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  complete ? "bg-brand-green text-brand-green-night" : "bg-brand-gold text-brand-green-night",
                )}
              >
                {complete ? <BadgeCheck className="size-3.5" aria-hidden="true" /> : <CircleAlert className="size-3.5" aria-hidden="true" />}
                {complete ? "Profil lengkap" : "Belum lengkap"}
              </span>
              <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"
                role="progressbar"
                aria-label="Kelengkapan profil"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={filled}
              >
                <div
                  className={cn("h-full rounded-full", complete ? "bg-brand-green" : "bg-brand-gold")}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-white/75">
                {filled} dari {total} data terisi
              </p>
            </div>
          )}
        </div>
      </section>

      {isApplicant ? (
        <ApplyParticipantCard />
      ) : (
        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          {/* Ringkasan kehadiran */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-6">
              <h2 className="font-heading text-base font-semibold text-primary">Ringkasan Kehadiran</h2>
              <ul className="mt-4 divide-y divide-line">
                <SummaryRow
                  icon={mode === "online" ? Video : MapPin}
                  label="Keterangan kehadiran"
                  value={mode ? MODE_KEHADIRAN_LABEL[mode] ?? null : null}
                />
                <SummaryRow icon={CalendarClock} label="Rencana kedatangan" value={formatArrival(profile?.rencana_kedatangan)} />
                <SummaryRow icon={Shirt} label="Ukuran baju" value={profile?.ukuran_baju ?? null} />
                <SummaryRow icon={Phone} label="No WhatsApp" value={profile?.no_whatsapp ?? null} />
              </ul>
            </div>
            {!complete && (
              <div className="flex gap-3 rounded-2xl border border-brand-gold/50 bg-gold-50 p-4 text-sm text-ink">
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-brand-gold-text" aria-hidden="true" />
                <p>
                  <span className="font-semibold">Lengkapi profil Anda</span> untuk membuka halaman Informasi Kamar Hotel dan
                  Publikasi.
                </p>
              </div>
            )}
          </aside>

          {/* Form */}
          <div className="rounded-3xl border border-line bg-white shadow-sm lg:col-span-8">
            <ProfileForm
              readOnly={locked}
              key={`${user.email}-${profile?.nama}-${profile?.rencana_kedatangan}`}
              initial={{
                email: user.email ?? "",
                nama: profile?.nama ?? "",
                perwakilanDaerah: profile?.perwakilan_daerah ?? "",
                jabatan: profile?.jabatan ?? "",
                ukuranBaju: profile?.ukuran_baju ?? "",
                noWhatsapp: profile?.no_whatsapp ?? "",
                rencanaKedatangan: isoToWibLocal(profile?.rencana_kedatangan),
                keteranganKehadiran: profile?.keterangan_kehadiran ?? "",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** Pengganti form profil untuk role `user`: cara menjadi peserta lewat panitia. */
function ApplyParticipantCard() {
  const { phone, url } = FOOTER_DATA.committee;
  return (
    <section
      aria-labelledby="apply-participant-title"
      className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-line bg-white p-6 text-center shadow-sm sm:p-8"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
        <UserPlus className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h2 id="apply-participant-title" className="font-heading text-xl font-bold text-primary">
          Ajukan Menjadi Peserta
        </h2>
        <p className="text-pretty text-ink-muted">
          Hubungi <span className="font-semibold whitespace-nowrap text-ink">{phone}</span> untuk menjadi peserta
          Rakernas 2027.
        </p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Hubungi panitia via WhatsApp di ${phone} (tab baru)`}
        className={cn(buttonVariants(), "h-11 gap-2 rounded-xl px-5")}
      >
        <WhatsAppIcon className="size-[18px]" />
        Hubungi via WhatsApp
      </a>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <>
      <main className="page-bg flex-1 px-4 py-8 sm:px-6 md:py-12">
        <Suspense fallback={null}>
          <ProfileContent />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
