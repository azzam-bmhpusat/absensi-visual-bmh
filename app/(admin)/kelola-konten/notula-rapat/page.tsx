import { readAdminRows } from "@/lib/content/server";
import { ContentManager, type ContentRowData } from "@/components/admin/content-manager";
import { KontenHeader, requireAdminPage } from "../shared";

export const instant = false;

export default async function KelolaNotulaRapatPage() {
  await requireAdminPage();
  const rows = await readAdminRows<ContentRowData>("meeting_minutes");
  return (
    <>
      <KontenHeader title="Notula Rapat" description="Notula dan keputusan rapat Rakernas." publicHref="/publikasi/notula-rapat" />
      <ContentManager kind="notula" rows={rows} />
    </>
  );
}
