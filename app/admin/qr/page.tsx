import { QrCard } from "@/components/admin/qr-card";

export default function AdminQrPage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://absensi-visual-bmh.vercel.app";
  const eventName =
    process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Koordinasi Nasional BMH";

  return (
    <main className="page-bg min-h-screen p-4 sm:p-8 flex items-center justify-center print:bg-white print:p-0 print:min-h-0 print:block">
      <QrCard siteUrl={siteUrl} eventName={eventName} />
    </main>
  );
}
