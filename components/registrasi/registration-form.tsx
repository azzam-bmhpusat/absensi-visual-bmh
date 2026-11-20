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
} from "@/app/(site)/registrasi/actions";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
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
