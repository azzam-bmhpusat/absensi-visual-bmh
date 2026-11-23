import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { UserManagement } from "@/components/admin/user-management";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_ROLE, toUserRole } from "@/lib/user-schema";
import { EMPTY_PROFILE, isBanned, USER_PROFILE_COLUMNS, type UserProfile, type UserRow } from "@/lib/user-row";

function UsersSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

const LOAD_ERROR =
  "Gagal memuat daftar pengguna. Pastikan migrasi 0008_profiles.sql dan 0009_admin_role_policies.sql sudah dijalankan serta SUPABASE_SERVICE_ROLE_KEY terisi.";

async function loadUsers(): Promise<UserRow[] | null> {
  try {
    const db = createAdminClient();
    const [listRes, profilesRes] = await Promise.all([
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      db.from("profiles").select(["id", "role", ...USER_PROFILE_COLUMNS].join(", ")),
    ]);
    if (listRes.error || profilesRes.error) {
      console.error("Gagal memuat pengguna:", listRes.error?.message, profilesRes.error?.message);
      return null;
    }
    const rows = (profilesRes.data ?? []) as unknown as Record<string, unknown>[];
    const profiles = new Map(
      rows.map((p) => [
        p.id as string,
        {
          role: toUserRole(p.role),
          profile: Object.fromEntries(
            USER_PROFILE_COLUMNS.map((c) => {
              const v = p[c];
              return [c, typeof v === "string" && v.trim() ? v.trim() : null];
            })
          ) as UserProfile,
        },
      ])
    );
    return listRes.data.users
      .map<UserRow>((u) => ({
        id: u.id,
        email: u.email ?? "(tanpa email)",
        role: profiles.get(u.id)?.role ?? DEFAULT_ROLE,
        profile: profiles.get(u.id)?.profile ?? EMPTY_PROFILE,
        banned: isBanned(u.banned_until),
        lastSignInAt: u.last_sign_in_at ?? null,
        createdAt: u.created_at,
      }))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } catch (error) {
    console.error("Gagal memuat pengguna:", error);
    return null;
  }
}

async function UsersContent() {
  await connection();
  // Halaman ini memakai service role, jadi pastikan pemanggilnya admin sebelum membaca apa pun.
  const supabase = await createClient();
  const me = await getAdminUser(supabase);
  if (!me) redirect("/admin/login?error=forbidden");

  const users = await loadUsers();

  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        {users ? <UserManagement users={users} currentUserId={me.id} /> : <p className="text-sm text-danger">{LOAD_ERROR}</p>}
      </CardContent>
    </Card>
  );
}

export default function ManajemenUserPage() {
  return (
    <Suspense fallback={<UsersSkeleton />}>
      <UsersContent />
    </Suspense>
  );
}
