import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { UserManagement } from "@/components/admin/user-management";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { loadUsers } from "@/lib/user-list";

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
