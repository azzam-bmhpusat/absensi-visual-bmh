"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, CalendarClock, Loader2, Save } from "lucide-react";
import { updateProfile, type ProfileActionResult } from "@/app/(site)/profile/actions";
import { formatArrival, wibLocalToIso } from "@/lib/profile-contact";
import { MODE_KEHADIRAN, MODE_KEHADIRAN_LABEL, UKURAN_BAJU } from "@/lib/participant-options";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface ProfileInitial {
  email: string;
  nama: string;
  perwakilanDaerah: string;
  jabatan: string;
  ukuranBaju: string;
  noWhatsapp: string;
  /** nilai datetime-local (WIB) */
  rencanaKedatangan: string;
  keteranganKehadiran: string;
}

const inputClass = "h-11 rounded-xl border-line";

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-primary">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<ProfileActionResult | null, FormData>(updateProfile, null);
  const [arrival, setArrival] = useState(initial.rencanaKedatangan);

  useEffect(() => {
    if (state?.success) {
      toast.success(state.message ?? "Profil berhasil disimpan.");
      router.refresh();
    }
  }, [state, router]);

  const preview = formatArrival(wibLocalToIso(arrival));

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-relaxed text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={initial.email} className={inputClass} disabled={isPending} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="nama" label="Nama lengkap (beserta gelar akademik)">
          <Input id="nama" name="nama" required maxLength={100} defaultValue={initial.nama} className={inputClass} disabled={isPending} />
        </Field>
        <Field id="perwakilan_daerah" label="Perwakilan Daerah">
          <Input
            id="perwakilan_daerah"
            name="perwakilan_daerah"
            required
            maxLength={100}
            defaultValue={initial.perwakilanDaerah}
            className={inputClass}
            disabled={isPending}
          />
        </Field>
        <Field id="jabatan" label="Jabatan">
          <Input id="jabatan" name="jabatan" required maxLength={100} defaultValue={initial.jabatan} className={inputClass} disabled={isPending} />
        </Field>
        <Field id="ukuran_baju" label="Ukuran Baju">
          <select
            id="ukuran_baju"
            name="ukuran_baju"
            required
            defaultValue={initial.ukuranBaju}
            disabled={isPending}
            className="h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="" disabled>
              Pilih ukuran
            </option>
            {UKURAN_BAJU.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>
        <Field id="no_whatsapp" label="No WhatsApp">
          <Input
            id="no_whatsapp"
            name="no_whatsapp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            defaultValue={initial.noWhatsapp}
            placeholder="081234567890"
            className={inputClass}
            disabled={isPending}
          />
        </Field>
        <Field id="rencana_kedatangan" label="Rencana Kedatangan (WIB)">
          <Input
            id="rencana_kedatangan"
            name="rencana_kedatangan"
            type="datetime-local"
            required
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className={inputClass}
            disabled={isPending}
          />
          {preview && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <CalendarClock className="h-3.5 w-3.5" />
              {preview}
            </p>
          )}
        </Field>
      </div>

      <fieldset className="space-y-1.5" disabled={isPending}>
        <legend className="text-xs font-semibold text-primary">Keterangan Kehadiran</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {MODE_KEHADIRAN.map((mode) => (
            <label
              key={mode}
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name="keterangan_kehadiran"
                value={mode}
                required
                defaultChecked={initial.keteranganKehadiran === mode}
                className="size-4 shrink-0 accent-primary"
              />
              {MODE_KEHADIRAN_LABEL[mode]}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" disabled={isPending} className="h-11 rounded-xl bg-primary px-6 font-medium text-white hover:bg-brand-green-deep">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Simpan
          </>
        )}
      </Button>
    </form>
  );
}
