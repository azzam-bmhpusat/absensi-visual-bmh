"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { removeAvatar, uploadAvatar, type ProfileActionResult } from "@/app/(site)/profile/actions";
import { AVATAR_MIME } from "@/lib/avatar";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button } from "@/components/ui/button";

const SIZE = 512;

/** Potong tengah jadi persegi 512px WebP agar kecil (< 1 MB) berapa pun ukuran foto aslinya. */
async function toSquareWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
  if (!blob || blob.type !== "image/webp") throw new Error("WebP tidak didukung");
  return new File([blob], "avatar.webp", { type: "image/webp" });
}

export function AvatarUpload({ src, name }: { src: string | null; name: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function report(result: ProfileActionResult) {
    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error ?? "Terjadi kesalahan.");
    }
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    startTransition(async () => {
      let file = picked;
      try {
        file = await toSquareWebp(picked);
      } catch {
        // browser tanpa dukungan: kirim file asli, server tetap memvalidasi
      }
      const fd = new FormData();
      fd.set("avatar", file);
      report(await uploadAvatar(fd));
    });
  }

  return (
    <div className="flex items-center gap-4">
      <UserAvatar src={src} name={name} className="size-20 text-2xl" />
      <div className="flex flex-wrap gap-2">
        <input ref={inputRef} type="file" accept={AVATAR_MIME.join(",")} className="sr-only" onChange={onPick} tabIndex={-1} aria-hidden="true" />
        <Button type="button" variant="outline" className="h-11 rounded-xl" disabled={isPending} onClick={() => inputRef.current?.click()}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
          {src ? "Ganti foto" : "Unggah foto"}
        </Button>
        {src && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl text-danger hover:text-danger"
            disabled={isPending}
            onClick={() => startTransition(async () => report(await removeAvatar()))}
          >
            <Trash2 className="size-4" />
            Hapus
          </Button>
        )}
      </div>
    </div>
  );
}
