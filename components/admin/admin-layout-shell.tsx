import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel Kehadiran BMH",
  description: "Panel administrasi, rekap data kehadiran, manajemen tamu, dan dashboard visual BMH",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminSharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="page-bg min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">{children}</div>
    </div>
  );
}
