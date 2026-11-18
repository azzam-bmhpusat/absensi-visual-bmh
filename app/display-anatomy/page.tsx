import { Suspense } from "react";
import { AnatomyBoard } from "@/components/display-anatomy/anatomy-board";
import { loadDisplayAnatomyData } from "@/lib/display-anatomy-data";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function Loader({ searchParams }: PageProps) {
  const params = await searchParams;
  const data = await loadDisplayAnatomyData(params?.sesi);
  return <AnatomyBoard {...data} />;
}

/** Videotron versi Anatomy. Duplikat fungsi /display; /display sendiri tidak diubah. */
export default function DisplayAnatomyPage({ searchParams }: PageProps) {
  return (
    <main className="iso da w-screen h-dvh overflow-hidden select-none" data-theme="dark">
      <Suspense fallback={<div className="h-full grid place-items-center text-sm opacity-60">Memuat videotron…</div>}>
        <Loader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
