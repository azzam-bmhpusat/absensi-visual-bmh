import { cn } from "cn";

/** Lingkaran foto profil; fallback inisial nama/email bila belum ada foto. */
export function UserAvatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 font-heading text-xs font-bold text-primary",
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto kecil dari Supabase Storage, tanpa remotePatterns
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
