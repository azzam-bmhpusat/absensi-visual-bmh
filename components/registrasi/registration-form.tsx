"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import {
  registrationSchema,
  MODE_KEHADIRAN,
  MODE_KEHADIRAN_LABEL,
  UKURAN_BAJU,
  type RegistrationInput,
} from "@/lib/registration-schema";
import {
  submitRegistration,
  type SubmitRegistrationResponse,
} from "@/app/registrasi/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RegistrationFormProps {
  footerUrl: string;
}

const fieldClass =
  "h-12 rounded-xl border-border bg-background/40 px-3 text-base text-foreground placeholder:text-muted-foreground";

// lucide-react tidak menyediakan ikon merek, jadi logo WhatsApp dibuat sebagai SVG inline.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {message}
    </p>
  );
}

export function RegistrationForm({ footerUrl }: RegistrationFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitRegistrationResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<RegistrationInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      nama: "",
      perwakilan_bmh: "",
      jabatan: "",
      departemen: "",
      ukuran_baju: undefined,
      mode_kehadiran: undefined,
      website: "",
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = form;

  const onSubmit = (values: RegistrationInput) => {
    startTransition(async () => {
      let res: SubmitRegistrationResponse;
      try {
        res = await submitRegistration(values);
      } catch {
        res = {
          status: "error",
          message: "Koneksi bermasalah. Silakan coba lagi.",
        };
      }

      if (res.status === "error" && res.fieldErrors) {
        for (const [field, messages] of Object.entries(res.fieldErrors)) {
          if (messages?.[0]) {
            setError(field as keyof RegistrationInput, { message: messages[0] });
          }
        }
        return;
      }

      setResult(res);
      setDialogOpen(true);
      if (res.status === "ok") reset();
    });
  };

  const success = result?.status === "ok";
  const failureMessage =
    result && result.status !== "ok"
      ? (result.message ?? "Pendaftaran gagal diproses. Silakan coba lagi.")
      : "";

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-5"
        aria-label="Formulir pendaftaran peserta"
      >
        {/* Honeypot: disembunyikan dari pengguna */}
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
          <label htmlFor="reg-website">Website</label>
          <input
            id="reg-website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("website")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-nama" className="text-sm font-medium">
            Nama Lengkap <span className="text-danger">*</span>
          </Label>
          <Input
            id="reg-nama"
            autoComplete="name"
            maxLength={100}
            placeholder="Nama lengkap beserta gelar"
            aria-invalid={Boolean(errors.nama)}
            className={fieldClass}
            disabled={isPending}
            {...register("nama")}
          />
          <FieldError message={errors.nama?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-perwakilan" className="text-sm font-medium">
            Perwakilan BMH <span className="text-danger">*</span>
          </Label>
          <Input
            id="reg-perwakilan"
            maxLength={100}
            placeholder="Contoh: BMH Perwakilan Jawa Timur"
            aria-invalid={Boolean(errors.perwakilan_bmh)}
            className={fieldClass}
            disabled={isPending}
            {...register("perwakilan_bmh")}
          />
          <FieldError message={errors.perwakilan_bmh?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-jabatan" className="text-sm font-medium">
            Jabatan <span className="text-danger">*</span>
          </Label>
          <Input
            id="reg-jabatan"
            maxLength={100}
            placeholder="Kepala Perwakilan, Kepala Departemen"
            aria-invalid={Boolean(errors.jabatan)}
            className={fieldClass}
            disabled={isPending}
            {...register("jabatan")}
          />
          <FieldError message={errors.jabatan?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-departemen" className="text-sm font-medium">
            Departemen{" "}
            <span className="text-xs font-normal text-muted-foreground">(opsional)</span>
          </Label>
          <Input
            id="reg-departemen"
            maxLength={100}
            placeholder="Kosongkan jika tidak ada"
            aria-invalid={Boolean(errors.departemen)}
            className={fieldClass}
            disabled={isPending}
            {...register("departemen")}
          />
          <FieldError message={errors.departemen?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-ukuran" className="text-sm font-medium">
            Ukuran Baju <span className="text-danger">*</span>
          </Label>
          <Controller
            control={control}
            name="ukuran_baju"
            render={({ field }) => (
              <Select
                value={field.value ?? null}
                onValueChange={(v) => field.onChange(v ?? undefined)}
                disabled={isPending}
              >
                <SelectTrigger
                  id="reg-ukuran"
                  aria-invalid={Boolean(errors.ukuran_baju)}
                  className="h-12 w-full rounded-xl border-border bg-background/40 px-3 text-base"
                >
                  <SelectValue placeholder="Pilih ukuran baju" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {UKURAN_BAJU.map((size) => (
                    <SelectItem key={size} value={size} className="py-2 text-base">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.ukuran_baju?.message} />
        </div>

        <fieldset className="space-y-2" disabled={isPending}>
          <legend className="text-sm font-medium">
            Keterangan Mengikuti Acara <span className="text-danger">*</span>
          </legend>
          <Controller
            control={control}
            name="mode_kehadiran"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-label="Keterangan mengikuti acara"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                {MODE_KEHADIRAN.map((mode) => {
                  const selected = field.value === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(mode)}
                      className={cn(
                        "flex h-12 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                        selected
                          ? "border-brand-green bg-brand-green/20 text-brand-gold-soft"
                          : "border-border bg-background/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {MODE_KEHADIRAN_LABEL[mode]}
                    </button>
                  );
                })}
              </div>
            )}
          />
          <FieldError message={errors.mode_kehadiran?.message} />
        </fieldset>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full bg-brand-gold text-base font-semibold text-brand-green-night hover:bg-brand-gold-soft"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Mengirim…
            </>
          ) : (
            "Kirim Pendaftaran"
          )}
        </Button>
      </form>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:max-w-md">
          <DialogHeader className="items-center space-y-3 text-center">
            {success ? (
              <CheckCircle2 className="size-12 text-brand-green" aria-hidden="true" />
            ) : (
              <TriangleAlert className="size-12 text-danger" aria-hidden="true" />
            )}
            <DialogTitle className="font-heading text-xl font-semibold">
              {success ? "Pendaftaran Berhasil" : "Pendaftaran Belum Berhasil"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {success
                ? "Terima kasih. Data Anda sudah kami terima dan akan ditinjau panitia. Silakan lanjut konfirmasi kehadiran kepada panitia."
                : failureMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {success ? (
              <>
                <Button
                  render={<Link href="/" />}
                  nativeButton={false}
                  variant="secondary"
                  className="h-12 w-full"
                >
                  Informasi acara
                </Button>
                <Button
                  render={<Link href="/#invited-guest-search" />}
                  nativeButton={false}
                  variant="outline"
                  className="h-12 w-full"
                >
                  Cek Pendaftaran Anda
                </Button>
                <Button
                  render={
                    <a href={footerUrl} target="_blank" rel="noopener noreferrer" />
                  }
                  nativeButton={false}
                  className="h-12 w-full gap-2 bg-[#25D366] font-semibold text-brand-green-night hover:bg-[#20BD5A]"
                >
                  <WhatsAppIcon className="size-5" />
                  Konfirmasi kehadiran
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="secondary"
                className="h-12 w-full"
                onClick={() => setDialogOpen(false)}
              >
                Tutup
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
