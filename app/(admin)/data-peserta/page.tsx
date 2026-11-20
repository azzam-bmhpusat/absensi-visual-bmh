import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminUser } from "@/lib/auth/admin";
import { ParticipantTable, type ParticipantRow } from "@/components/admin/participant-table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Data Peserta" };

const LOAD_ERROR =
  "Gagal memuat data peserta. Pastikan migrasi 0012 dan 0014 sudah dijalankan serta SUPABASE_SERVICE_ROLE_KEY terisi.";

async function loadParticipants(): Promise<ParticipantRow[] | null> {
  try {
    const db = createAdminClient();
    const [profilesRes, usersRes] = await Promise.all([
      db
        .from("profiles")
        .select(
          "id, role, nama, perwakilan_daerah, jabatan, ukuran_baju, no_whatsapp, rencana_kedatangan, keterangan_kehadiran"
        )
        .order("nama", { nullsFirst: false }),
      db.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (profilesRes.error || usersRes.error) {
      console.error("Gagal memuat data peserta:", profilesRes.error?.message, usersRes.error?.message);
      return null;
    }
    const emails = new Map(usersRes.data.users.map((u) => [u.id, u.email ?? ""]));
    return (profilesRes.data ?? []).map((p) => ({
      id: p.id as string,
      isAdmin: p.role === "admin",
      nama: p.nama ?? "",
      email: emails.get(p.id as string) ?? "",
      perwakilanDaerah: p.perwakilan_daerah ?? "",
      jabatan: p.jabatan ?? "",
      ukuranBaju: p.ukuran_baju ?? "",
      noWhatsapp: p.no_whatsapp ?? "",
      rencanaKedatangan: p.rencana_kedatangan ?? null,
      keteranganKehadiran: p.keterangan_kehadiran ?? "",
    }));
  } catch (error) {
    console.error("Gagal memuat data peserta:", error);
    return null;
  }
}

async function ParticipantsContent() {
  await connection();
  // Memakai service role (kolom privat), jadi pastikan pemanggilnya admin.
  const supabase = await createClient();
  const me = await getAdminUser(supabase);
  if (!me) redirect("/admin/login?error=forbidden");

  const rows = await loadParticipants();

  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardContent className="p-5 sm:p-6">
        {rows ? <ParticipantTable rows={rows} /> : <p className="text-sm text-danger">{LOAD_ERROR}</p>}
      </CardContent>
    </Card>
  );
}

export default function DataPesertaPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      }
    >
      <ParticipantsContent />
    </Suspense>
  );
}
