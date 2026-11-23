import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";
import { avatarPublicUrl } from "@/lib/avatar";
import { AccountDropdown } from "./account-dropdown";

/** Tombol Masuk (belum login) — juga dipakai sebagai fallback Suspense. */
export function LoginLink() {
  return (
    <Link
      href="/login"
      className={cn(
        buttonVariants(),
        "h-11 rounded-lg bg-brand-green-deep px-4 text-sm font-semibold text-white hover:bg-brand-green-deep/90"
      )}
    >
      Masuk
    </Link>
  );
}

/** Slot akun di navbar: Masuk bila belum login, dropdown profil bila sudah. */
export async function AccountMenu() {
  await connection();
  const supabase = await createClient();
  const { user, isAdmin } = await checkAdmin(supabase);
  if (!user) return <LoginLink />;

  let nama = "";
  let avatarUrl: string | null = null;
  try {
    const { data } = await createAdminClient().from("profiles").select("nama, avatar_url").eq("id", user.id).maybeSingle();
    nama = data?.nama ?? "";
    avatarUrl = avatarPublicUrl(data?.avatar_url);
  } catch {
    // nama & foto opsional; inisial email tetap ditampilkan
  }
  return <AccountDropdown name={nama} email={user.email ?? ""} avatarUrl={avatarUrl} isAdmin={isAdmin} />;
}
