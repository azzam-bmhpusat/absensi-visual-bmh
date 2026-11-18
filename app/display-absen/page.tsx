import { Suspense } from "react";
import { AbsenScene } from "@/components/display-absen/scene";
import { loadDisplayAnatomyData } from "@/lib/display-anatomy-data";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function Loader({ searchParams }: PageProps) {
  const params = await searchParams;
  const demo = params?.demo === "1";
  const data = await loadDisplayAnatomyData(params?.sesi);
  // Mode gladi: tamu tiruan, tanpa baca/tulis database (hanya bila ?demo=1)
  if (demo) return <AbsenScene {...data} guests={[]} attendances={[]} demo />;
  return <AbsenScene {...data} />;
}

/** Layar kehadiran satu adegan: panggung + tribun penonton. Memakai data yang sama dengan /display. */
export default function DisplayAbsenPage({ searchParams }: PageProps) {
  return (
    <main className="iso da ab-root select-none" data-theme="dark">
      <Suspense
        fallback={
          <div className="ab-loading" aria-hidden="true">
            <i />
          </div>
        }
      >
        <Loader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
