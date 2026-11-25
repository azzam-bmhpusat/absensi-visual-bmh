import { connection } from "next/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";

/** Wajib admin (sama seperti /pengaturan); bukan admin -> login admin. */
export async function requireAdminPage() {
  await connection();
  if (!(await getAdminUser(await createClient()))) redirect("/admin/login");
}

export function KontenHeader({ title, description, publicHref }: { title: string; description: string; publicHref: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-xs font-semibold tracking-[0.16em] text-ink-muted uppercase">Kelola Konten</p>
        <h1 className="font-heading text-2xl font-bold text-primary">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </div>
      <Link href={publicHref} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
        Lihat halaman publik
        <ExternalLink className="size-4" aria-hidden="true" />
      </Link>
    </header>
  );
}
