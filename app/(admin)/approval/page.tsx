import { Suspense } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ApprovalTable } from "@/components/admin/approval-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RegistrationRow } from "@/lib/registration-row";

function ApprovalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function ApprovalContent() {
  await connection();
  // Data pendaftar bersifat pribadi: dibaca dengan sesi admin (RLS authenticated)
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select(
      "id, nama, perwakilan_bmh, jabatan, departemen, ukuran_baju, mode_kehadiran, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat registrations:", error.code, error.message);
  }

  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        {error ? (
          <p className="text-sm text-danger">
            Gagal memuat data pendaftar. Pastikan migrasi 0007_registrations.sql sudah dijalankan.
          </p>
        ) : (
          <ApprovalTable registrations={(data ?? []) as RegistrationRow[]} />
        )}
      </CardContent>
    </Card>
  );
}

export default function ApprovalPage() {
  return (
    <Suspense fallback={<ApprovalSkeleton />}>
      <ApprovalContent />
    </Suspense>
  );
}
