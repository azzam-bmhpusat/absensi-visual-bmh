"use client";

import { useState } from "react";
import { cn } from "cn";

/** Lingkaran foto profil; fallback inisial nama/email bila belum ada foto. */
export function UserAvatar({ src, name, initials, className }: {
  src?: string | null;
  name: string;
  initials?: string;
  className?: string;
}) {
  return <AvatarImage key={src} src={src} initials={initials || name.trim().charAt(0).toUpperCase() || "?"} className={className} />;
}

function AvatarImage({ src, initials, className }: { src?: string | null; initials: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 font-heading text-xs font-bold text-primary",
        className
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto kecil dari Supabase Storage, tanpa remotePatterns
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
