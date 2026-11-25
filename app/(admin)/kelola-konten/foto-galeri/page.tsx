import { readAdminRows } from "@/lib/content/server";
import { ContentManager, type ContentRowData } from "@/components/admin/content-manager";
import { KontenHeader, requireAdminPage } from "../shared";

export const instant = false;

export default async function KelolaFotoGaleriPage() {
  await requireAdminPage();
  const rows = await readAdminRows<ContentRowData>("gallery_albums");
  return (
    <>
      <KontenHeader title="Foto Galeri Kegiatan" description="Album foto yang tampil di halaman Publikasi." publicHref="/publikasi/foto-galeri-kegiatan" />
      <ContentManager kind="album" rows={rows} />
    </>
  );
}
