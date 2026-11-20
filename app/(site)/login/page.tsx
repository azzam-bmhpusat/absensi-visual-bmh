import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
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

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
          <CardHeader className="pb-2 pt-6 text-center">
            <CardTitle className="font-heading text-xl font-bold text-primary">Masuk</CardTitle>
            <p className="text-xs text-ink-muted">Masuk untuk melihat dan melengkapi profil Anda</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <Suspense fallback={null}>
              <Form searchParams={searchParams} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
