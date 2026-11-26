import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkAdmin } from "@/lib/auth/admin";
import { LogIn } from "lucide-react";
import { avatarPublicUrl } from "@/lib/avatar";
import { AccountDropdown } from "./account-dropdown";

/** Tombol Masuk (belum login) — juga dipakai sebagai fallback Suspense. */
export function LoginLink() {
  return (
    <Link
      href="/login"
      className="group/login relative isolate inline-flex h-11 items-center gap-2.5 overflow-hidden rounded-full bg-linear-to-b from-[#0B6355] to-[#04362F] py-[5px] pr-[5px] pl-4 text-sm font-semibold text-white shadow-[0_4px_16px_#09504640,inset_0_1px_0_#FFFFFF33] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 in-data-compact:text-[13px] sm:in-data-compact:text-sm lg:text-[15px] lg:in-data-compact:text-[15px]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border border-transparent [background:linear-gradient(to_bottom,#FFFFFF59,#FFFFFF00)_border-box] [mask:linear-gradient(#000_0_0)_padding-box_exclude,linear-gradient(#000_0_0)_border-box]"
      />
      Masuk
      <span className="flex size-[26px] items-center justify-center rounded-full bg-brand-gold text-[#04362F] transition-transform group-hover/login:translate-x-0.5 lg:size-7">
        <LogIn aria-hidden="true" className="size-3.5" strokeWidth={2.25} />
      </span>
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
