import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { PublicFooter } from "@/components/rakernas/public-page";
import { safeNextPath } from "@/lib/profile-contact";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string | string[] }>;

/** searchParams dibaca di dalam Suspense agar halaman tetap bisa diprerender. */
async function Form({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const value = Array.isArray(next) ? next[0] : next;
  return <LoginForm next={value ? safeNextPath(value) : undefined} />;
}

/** Judul khusus saat diarahkan dari halaman publikasi (next selain /profile). */
async function Title({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  const value = Array.isArray(next) ? next[0] : next;
  const path = value ? safeNextPath(value) : undefined;
  const gated = path && path !== "/" && !path.startsWith("/profile");
  return <TitleText text={gated ? "Masuk untuk Akses Halaman" : "Masuk"} />;
}

function TitleText({ text }: { text: string }) {
  return <h1 className="font-heading text-xl font-bold text-primary">{text}</h1>;
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <main className="page-bg flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-4">
          <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
            <CardHeader className="pb-2 pt-6 text-center">
              <Suspense fallback={<TitleText text="Masuk" />}>
                <Title searchParams={searchParams} />
              </Suspense>
              <p className="text-sm text-ink-muted">Masuk untuk melihat dan melengkapi profil Anda</p>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-2">
              <Suspense fallback={null}>
                <Form searchParams={searchParams} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
