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

  const pickLabel = src ? "Ganti foto" : "Unggah foto";
  const pick = () => inputRef.current?.click();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar
          src={src}
          name={name}
          className="size-24 text-3xl ring-4 ring-white/90 shadow-lg shadow-black/20 md:size-28 md:text-4xl"
        />
        <span aria-hidden="true" className="pointer-events-none absolute -inset-1.5 rounded-full ring-2 ring-brand-gold/60" />
        {isPending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45">
            <Loader2 className="size-7 animate-spin text-white" aria-hidden="true" />
            <span className="sr-only">Memproses foto…</span>
          </span>
        )}
        <button
          type="button"
          onClick={pick}
          disabled={isPending}
          aria-label={pickLabel}
          className="absolute -right-1 -bottom-1 flex size-10 items-center justify-center rounded-full bg-brand-gold text-brand-green-night shadow-md ring-3 ring-white transition-colors hover:bg-brand-gold-soft focus-visible:outline-none focus-visible:ring-brand-gold-soft disabled:opacity-60"
        >
          <Camera className="size-5" aria-hidden="true" />
        </button>
      </div>
      <input ref={inputRef} type="file" accept={AVATAR_MIME.join(",")} className="sr-only" onChange={onPick} tabIndex={-1} aria-hidden="true" />
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-11 rounded-xl bg-white/10 px-4 text-white hover:bg-white/20 hover:text-white"
          disabled={isPending}
          onClick={pick}
        >
          <Camera className="size-4" aria-hidden="true" />
          {pickLabel}
        </Button>
        {src && (
          <Button
            type="button"
            variant="ghost"
            className="h-11 rounded-xl px-4 text-red-200 hover:bg-red-500/15 hover:text-red-100"
            disabled={isPending}
            onClick={() => startTransition(async () => report(await removeAvatar()))}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Hapus
          </Button>
        )}
      </div>
    </div>
  );
}
