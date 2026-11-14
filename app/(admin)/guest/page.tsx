import { Suspense } from "react";
import { createPublicServerClient } from "@/lib/supabase/server";
import { GuestTable, type GuestItem } from "@/components/admin/guest-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function GuestSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  );
}

async function GuestContent() {
  const supabase = createPublicServerClient();

  const guestsRes = await supabase
    .from("guests")
    .select("id, nama, perwakilan_daerah, created_at")
    .order("created_at", { ascending: false });

  const rawGuests = guestsRes.data || [];
  const guests: GuestItem[] = rawGuests.map((g) => ({
    id: g.id,
    nama: g.nama,
    perwakilan_daerah: g.perwakilan_daerah,
    created_at: g.created_at,
  }));

  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <GuestTable initialGuests={guests} />
      </CardContent>
    </Card>
  );
}

export default function GuestPage() {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <GuestContent />
    </Suspense>
  );
}