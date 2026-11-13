import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel Admin Kehadiran",
  description: "Panel administrasi, rekap data kehadiran, import tamu, dan cetak QR BMH",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
