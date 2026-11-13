"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Info, Loader2 } from "lucide-react";
import { attendanceSchema, type AttendanceInput } from "@/lib/schemas";
import {
  submitAttendance,
  type SubmitAttendanceResponse,
} from "@/app/absen/actions";
import { NameCombobox, type GuestItem } from "./name-combobox";
import { DaerahCombobox } from "./daerah-combobox";

type DialogState = "form" | "success" | "already";

interface AttendanceDialogProps {
  sessionId: number;
  sessionNama: string;
  guests: GuestItem[];
  daerahList: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AttendanceDialog({
  sessionId,
  sessionNama,
  guests,
  daerahList,
  open,
  onOpenChange,
}: AttendanceDialogProps) {
  const [state, setState] = useState<DialogState>("form");
  const [result, setResult] = useState<SubmitAttendanceResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AttendanceInput>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      sessionId: sessionId as 1 | 2 | 3,
      guestId: "",
      nama: "",
      perwakilanDaerah: "",
      website: "",
    },
  });

  function onSubmit(values: AttendanceInput) {
    startTransition(async () => {
      const res = await submitAttendance(values);
      setResult(res);
      if (res.status === "ok") {
        setState("success");
      } else if (res.status === "already") {
        setState("already");
      }
    });
  }

  function handleGuestSelect(guest: GuestItem | null) {
    if (guest) {
      form.setValue("guestId", guest.id);
      form.setValue("nama", guest.nama, { shouldValidate: true });
      form.setValue("perwakilanDaerah", guest.perwakilan_daerah, {
        shouldValidate: true,
      });
    } else {
      form.setValue("guestId", "");
    }
  }

  function handleClose() {
    setState("form");
    setResult(null);
    form.reset({
      sessionId: sessionId as 1 | 2 | 3,
      guestId: "",
      nama: "",
      perwakilanDaerah: "",
      website: "",
    });
    onOpenChange(false);
  }

  const selectedGuestId = useWatch({ control: form.control, name: "guestId" });
  const watchedNama = useWatch({ control: form.control, name: "nama" });
  const watchedPerwakilanDaerah = useWatch({ control: form.control, name: "perwakilanDaerah" });

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : null)}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[440px] rounded-3xl p-5 sm:p-6 border-line">
        {state === "form" && (
          <>
            <DialogHeader className="space-y-2 text-left">
              <div>
                <Badge
                  variant="outline"
                  className="bg-gold-50 text-brand-gold-text border-brand-gold-soft px-3 py-1 text-xs font-semibold"
                >
                  {sessionNama}
                </Badge>
              </div>
              <DialogTitle className="font-heading text-xl font-bold text-primary">
                Konfirmasi Kehadiran
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 pt-2 text-left"
            >
              {/* Field Nama */}
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-sm font-medium text-foreground">
                  Nama Lengkap <span className="text-danger">*</span>
                </Label>
                <NameCombobox
                  guests={guests}
                  value={watchedNama ?? ""}
                  onChange={(val) => {
                    form.setValue("nama", val, { shouldValidate: true });
                  }}
                  onGuestSelect={handleGuestSelect}
                  disabled={isPending}
                />
                {form.formState.errors.nama && (
                  <p className="text-xs text-danger font-medium mt-1">
                    {form.formState.errors.nama.message}
                  </p>
                )}
              </div>

              {/* Field Perwakilan Daerah */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="perwakilanDaerah"
                  className="text-sm font-medium text-foreground"
                >
                  Perwakilan Daerah <span className="text-danger">*</span>
                </Label>
                <DaerahCombobox
                  daerahList={daerahList}
                  value={watchedPerwakilanDaerah ?? ""}
                  onChange={(val) => {
                    form.setValue("perwakilanDaerah", val, { shouldValidate: true });
                  }}
                  disabled={isPending || (!!selectedGuestId && selectedGuestId.length > 0)}
                />
                {selectedGuestId && (
                  <p className="text-[11px] text-ink-muted">
                    Terisi otomatis dari database tamu terdaftar.
                  </p>
                )}
                {form.formState.errors.perwakilanDaerah && (
                  <p className="text-xs text-danger font-medium mt-1">
                    {form.formState.errors.perwakilanDaerah.message}
                  </p>
                )}
              </div>

              {/* Honeypot field - tersembunyi dari user */}
              <div
                className="absolute -left-[9999px] opacity-0 pointer-events-none"
                aria-hidden="true"
              >
                <Input
                  {...form.register("website")}
                  tabIndex={-1}
                  autoComplete="off"
                  placeholder="Website"
                />
              </div>

              {/* Error dari server action */}
              {result?.status === "error" && result.message && (
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/20 text-xs text-danger text-center">
                  {result.message}
                </div>
              )}

              {/* Tombol Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full h-12 rounded-xl bg-primary hover:bg-brand-green-deep text-white font-semibold text-base shadow-sm transition-all mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Mencatat Kehadiran...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Hadir</span>
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* State SUKSES */}
        {state === "success" && result?.status === "ok" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-brand-green flex items-center justify-center shadow-sm">
              <Check className="w-8 h-8 text-white stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-primary">
                Terima kasih, {result.nama}
              </h3>
              <p className="text-sm text-ink-muted">
                Kehadiran Anda telah berhasil tercatat di {result.sesi}.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="rounded-xl h-11 px-8 text-primary font-semibold hover:bg-secondary/80 border border-brand-green/20 cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        )}

        {/* State SUDAH TERCATAT (already) */}
        {state === "already" && result?.status === "already" && (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gold-50 flex items-center justify-center border border-brand-gold-soft shadow-sm">
              <Info className="w-8 h-8 text-brand-gold stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-heading text-xl font-bold text-primary">
                Sudah Tercatat Hadir
              </h3>
              <p className="text-sm text-ink-muted">
                {result.message}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={handleClose}
              className="rounded-xl h-11 px-8 text-primary font-semibold hover:bg-secondary/80 border border-brand-green/20 cursor-pointer"
            >
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
