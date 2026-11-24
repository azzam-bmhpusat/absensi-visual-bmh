import type { Metadata } from "next";
import { Suspense } from "react";
import { LockKeyhole } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoginForm, type GoogleLoginError } from "@/components/auth/login-form";
import { LoginTransition, LoginTransitionItem } from "@/components/auth/login-transition";
import { PublicFooter } from "@/components/rakernas/public-page";
import { NAV_MENU } from "@/content/rakernas";
import { safeNextPath } from "@/lib/profile-contact";
import { emailSchema } from "@/lib/user-schema";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ next?: string | string[]; email?: string | string[]; error?: string | string[] }>;

const DEFAULT_SUBTITLE = "Masuk untuk melihat dan melengkapi profil Anda";

/** Nama halaman tujuan dari menu navbar (mis. "/informasi-kamar-hotel" -> "Informasi Kamar Hotel"). */
const PAGE_LABELS = new Map(
  NAV_MENU.flatMap((entry) => (entry.children ? entry.children : [entry])).map((item) => [item.href, item.label])
);

/** Nilai ?error= dari alur login Google -> jenis pesan di LoginForm. */
const GOOGLE_ERROR_PARAMS: Record<string, GoogleLoginError | undefined> = {
  google: "failed",
  google_disabled: "disabled",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function TitleText({ text }: { text: string }) {
  return <h1 className="font-heading text-xl font-bold text-primary">{text}</h1>;
}

/** Kerangka kartu: dipakai sebagai fallback Suspense dan isi kartu sebenarnya. */
function LoginCardShell({ header, children }: { header: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Card className="rounded-3xl border-line bg-white/95 shadow-sm">
      <CardHeader className="pb-2 pt-6 text-center">{header}</CardHeader>
      <CardContent className="px-6 pb-6 pt-2">{children}</CardContent>
    </Card>
  );
}

/**
 * searchParams dibaca di dalam Suspense agar halaman tetap bisa diprerender.
 * Kartu dianimasikan ulang setiap halaman tujuan (?next=) berganti.
 */
async function LoginCard({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const nextValue = first(params.next);
  const next = nextValue ? safeNextPath(nextValue) : undefined;
  // Judul khusus saat diarahkan dari halaman wajib-login (next selain /profile).
  const gated = !!next && next !== "/" && !next.startsWith("/profile");
  const destination = gated ? PAGE_LABELS.get(next) : undefined;
  // ?email= dari /form: diisi otomatis bila formatnya valid.
  const parsedEmail = emailSchema.safeParse(first(params.email));

  return (
    <LoginTransition transitionKey={next ?? ""}>
      <LoginCardShell
        header={
          <>
            {destination && (
              <LoginTransitionItem className="mb-1 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                  <LockKeyhole aria-hidden="true" className="size-3.5" />
                  {destination}
                </span>
              </LoginTransitionItem>
            )}
            <LoginTransitionItem>
              <TitleText text={gated ? "Masuk untuk Akses Halaman" : "Masuk"} />
            </LoginTransitionItem>
            <LoginTransitionItem>
              <p className="text-sm text-ink-muted">
                {destination ? `Masuk untuk membuka halaman ${destination}` : DEFAULT_SUBTITLE}
              </p>
            </LoginTransitionItem>
          </>
        }
      >
        <LoginTransitionItem>
          <LoginForm
            next={next}
            defaultEmail={parsedEmail.success ? parsedEmail.data : undefined}
            googleError={GOOGLE_ERROR_PARAMS[first(params.error) ?? ""]}
          />
        </LoginTransitionItem>
      </LoginCardShell>
    </LoginTransition>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <main className="page-bg flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-4">
          <Suspense
            fallback={
              <LoginCardShell
                header={
                  <>
                    <TitleText text="Masuk" />
                    <p className="text-sm text-ink-muted">{DEFAULT_SUBTITLE}</p>
                  </>
                }
              />
            }
          >
            <LoginCard searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Suspense fallback={null}>
        <PublicFooter />
      </Suspense>
    </>
  );
}
