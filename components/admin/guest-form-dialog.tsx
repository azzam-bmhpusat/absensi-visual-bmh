"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { guestRowSchema, type GuestRowInput } from "@/lib/schemas";
import { addGuestAction, updateGuestAction } from "@/app/admin/actions";
import { toast } from "sonner";
import type { GuestItem } from "./guest-table";

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: GuestItem | null;
  onSuccess?: () => void;
}

export function GuestFormDialog({
  open,
  onOpenChange,
  guest,
  onSuccess,
}: GuestFormDialogProps) {
  const isEdit = Boolean(guest);
  const [isPending, startTransition] = useTransition();

  const form = useForm<GuestRowInput>({
    resolver: zodResolver(guestRowSchema),
    defaultValues: {
      nama: "",
      perwakilan_daerah: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (guest) {
        form.reset({
          nama: guest.nama,
          perwakilan_daerah: guest.perwakilan_daerah,
        });
      } else {
        form.reset({
          nama: "",
          perwakilan_daerah: "",
        });
      }
    }
  }, [open, guest, form]);

  const onSubmit = (values: GuestRowInput) => {
    startTransition(async () => {
      let res;
      if (isEdit && guest) {
        res = await updateGuestAction(guest.id, values);
      } else {
        res = await addGuestAction(values);
      }

      if (res.success) {
        toast.success(
          isEdit
            ? `Data tamu "${values.nama}" berhasil diperbarui.`
            : `Tamu "${values.nama}" berhasil ditambahkan.`
        );
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || "Gagal menyimpan data tamu.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-primary flex items-center gap-2">
            {isEdit ? (
              <>
                <UserCheck className="w-5 h-5 text-brand-green" />
                Edit Data Tamu Undangan
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-brand-green" />
                Tambah Tamu Undangan
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            {isEdit
              ? "Ubah data nama atau perwakilan daerah tamu undangan."
              : "Masukkan informasi nama lengkap dan perwakilan daerah tamu undangan."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="nama-guest" className="text-xs font-semibold text-primary">
              Nama Lengkap <span className="text-danger">*</span>
            </Label>
            <Input
              id="nama-guest"
              {...form.register("nama")}
              placeholder="Contoh: Dr. H. Ahmad Dahlan, M.Ag"
              className="h-10 rounded-xl border-line text-xs focus-visible:ring-brand-green"
              disabled={isPending}
            />
            {form.formState.errors.nama && (
              <p className="text-[11px] text-danger font-medium">
                {form.formState.errors.nama.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="daerah-guest" className="text-xs font-semibold text-primary">
              Perwakilan Daerah / Wilayah <span className="text-danger">*</span>
            </Label>
            <Input
              id="daerah-guest"
              {...form.register("perwakilan_daerah")}
              placeholder="Contoh: Jawa Timur atau DKI Jakarta"
              className="h-10 rounded-xl border-line text-xs focus-visible:ring-brand-green"
              disabled={isPending}
            />
            {form.formState.errors.perwakilan_daerah && (
              <p className="text-[11px] text-danger font-medium">
                {form.formState.errors.perwakilan_daerah.message}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-xl border-line text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-primary hover:bg-brand-green-deep text-white text-xs font-semibold shadow-xs"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : isEdit ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Tamu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
