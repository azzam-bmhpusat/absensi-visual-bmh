import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Videotron Kehadiran Realtime",
  description: "Layar monitor kehadiran realtime peserta acara BMH",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
