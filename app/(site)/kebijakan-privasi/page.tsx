import type { Metadata } from "next";
import { PublicPage } from "@/components/rakernas/public-page";
import { EVENT_INFO, FOOTER_DATA } from "@/content/rakernas";
import { buildSocialMetadata } from "@/lib/og-metadata";

// Sama seperti halaman publik lain: footer PublicPage memuat event settings di luar Suspense.
export const instant = false;

const TITLE = "Kebijakan Privasi";
/** Tanggal berlaku; perbarui bila isi kebijakan berubah. */
const EFFECTIVE_DATE = "24 November 2026";

export const metadata: Metadata = {
  title: TITLE,
  description: `Data apa yang dikumpulkan situs ${EVENT_INFO.title}, untuk apa dipakai, dan cara meminta penghapusannya.`,
  ...buildSocialMetadata({ title: TITLE, path: "/kebijakan-privasi" }),
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-lg font-semibold text-primary md:text-xl">{title}</h2>
      <div className="space-y-3 text-pretty text-ink">{children}</div>
    </section>
  );
}

/**
 * Kebijakan privasi publik (tanpa login). Dibutuhkan Google untuk verifikasi merek aplikasi OAuth
 * "Login dengan Google", agar layar izin dan email Google menampilkan nama aplikasi.
 */
export default function KebijakanPrivasiPage() {
  const { phone, url: whatsappUrl, label: committee } = FOOTER_DATA.committee;

  return (
    <PublicPage title={TITLE}>
      <article className="max-w-3xl space-y-8 rounded-3xl border border-line bg-white p-6 leading-relaxed shadow-sm md:p-10">
        <p className="text-sm text-ink-muted">Berlaku sejak {EFFECTIVE_DATE}</p>

        <p>
          Situs ini dikelola oleh {committee} untuk penyelenggaraan {EVENT_INFO.title} (Baitul Maal Hidayatullah). Halaman
          ini menjelaskan data apa yang kami kumpulkan, untuk apa data itu dipakai, dan bagaimana Anda dapat meminta
          penghapusannya.
        </p>

        <Section title="Data yang kami kumpulkan">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Login dengan Google:</strong> nama dan alamat email akun Google Anda. Layanan login kami (Supabase
              Auth) juga menerima tautan foto profil Google sebagai bagian dari data login; situs ini tidak menampilkannya.
            </li>
            <li>
              <strong>Akun peserta:</strong> email dan kata sandi yang dibuat panitia, serta data profil yang Anda isi:
              nama, perwakilan daerah, jabatan, ukuran baju, nomor WhatsApp, rencana kedatangan, keterangan kehadiran, dan
              foto profil bila Anda mengunggahnya.
            </li>
            <li>
              <strong>Kehadiran:</strong> catatan presensi saat Anda memindai kode QR di lokasi acara.
            </li>
          </ul>
        </Section>

        <Section title="Untuk apa data dipakai">
          <p>
            Data hanya dipakai untuk penyelenggaraan acara: pendaftaran dan verifikasi peserta, pengaturan akomodasi dan
            perlengkapan, presensi, serta komunikasi panitia dengan peserta. Kami tidak menjual data Anda, tidak
            membagikannya kepada pihak lain untuk iklan, dan tidak memakainya untuk keperluan di luar acara.
          </p>
        </Section>

        <Section title="Data yang tampil untuk umum">
          <p>
            Untuk peserta terdaftar, nama, perwakilan daerah, dan jabatan dapat tampil di layar presensi dan papan
            kehadiran acara. Email, nomor WhatsApp, dan rencana kedatangan tidak ditampilkan untuk umum. Akun yang belum
            terdaftar sebagai peserta, termasuk akun Google baru, tidak tampil di daftar peserta.
          </p>
        </Section>

        <Section title="Penyimpanan dan keamanan">
          <p>
            Data disimpan di layanan basis data Supabase, dan situs dijalankan di Vercel. Akses ke data pribadi dibatasi
            untuk panitia yang berwenang. Situs memakai cookie yang diperlukan agar Anda tetap masuk dan untuk akses
            formulir; tidak ada cookie iklan atau pelacak pihak ketiga.
          </p>
        </Section>

        <Section title="Hak Anda dan penghapusan data">
          <p>
            Anda dapat meminta salinan, perbaikan, atau penghapusan data Anda kapan saja dengan menghubungi panitia
            melalui WhatsApp{" "}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-4"
            >
              {phone}
            </a>
            . Anda juga dapat mencabut akses situs ini dari akun Google Anda di{" "}
            <a
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline underline-offset-4"
            >
              myaccount.google.com/connections
            </a>
            .
          </p>
        </Section>

        <Section title="Perubahan kebijakan">
          <p>
            Bila kebijakan ini berubah, versi terbaru beserta tanggal berlakunya akan ditampilkan di halaman ini.
          </p>
        </Section>
      </article>
    </PublicPage>
  );
}
