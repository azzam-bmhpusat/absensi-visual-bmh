import { readAdminRows } from "@/lib/content/server";
import { ContentManager, type ContentRowData } from "@/components/admin/content-manager";
import { KontenHeader, requireAdminPage } from "../shared";

export const instant = false;

export default async function KelolaMateriPresentasiPage() {
  await requireAdminPage();
  const rows = await readAdminRows<ContentRowData>("presentation_materials");
  return (
    <>
      <KontenHeader title="Materi Presentasi Rakernas" description="Materi presentasi yang dapat diunduh peserta." publicHref="/publikasi/materi-presentasi-rakernas" />
      <ContentManager kind="materi" rows={rows} />
    </>
  );
}
