import { SiteFooter } from "@/components/rakernas/site-footer";
import { getEventSettings } from "@/lib/event-settings-server";

/** Footer situs publik dengan data acara terkini (tanggal & venue dari event settings). */
export async function PublicFooter({ showNav }: { showNav?: boolean } = {}) {
  const settings = await getEventSettings();
  return <SiteFooter className="bg-brand-green-night" settings={settings} showNav={showNav} />;
}

/**
 * Kerangka halaman publik sederhana: judul halaman + area isi + footer.
 * Navbar berasal dari app/(site)/layout.tsx.
 */
export async function PublicPage({
  title,
  hero,
  children,
}: {
  title: string;
  /** Header khusus pengganti judul polos; harus memuat <h1> sendiri. */
  hero?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <>
      <main className="bg-background flex-1 px-5 pt-[calc(72px+env(safe-area-inset-top)+2.5rem)] pb-10 md:px-8 md:pt-[calc(72px+env(safe-area-inset-top)+4rem)] md:pb-16">
        <div className="mx-auto w-full max-w-screen-xl">
          {hero ?? (
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-primary md:text-4xl">
              {title}
            </h1>
          )}
          <div className="mt-8 min-h-[40vh]">{children}</div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
