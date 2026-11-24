import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RegisterServiceWorker } from "@/components/pwa/register-service-worker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#095046",
  width: "device-width",
  initialScale: 1,
  // Konten sampai tepi layar iPhone berponi; tab bar bawah memakai env(safe-area-inset-bottom).
  viewportFit: "cover",
};

// Dasar URL absolut untuk og:image dll. (wajib untuk preview WhatsApp)
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sistem Absensi Visual QR BMH",
    template: "%s | Absensi Visual BMH",
  },
  description: "Sistem kehadiran visual cepat dan realtime untuk acara Baitul Maal Hidayatullah (BMH)",
  applicationName: "Rakernas BMH",
  icons: {
    icon: "/icons/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
  // Saat dipasang ke layar utama iPhone (PWA)
  appleWebApp: {
    capable: true,
    title: "Rakernas BMH",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${poppins.variable} antialiased scroll-smooth`} suppressHydrationWarning>
      <body className="min-h-screen font-sans bg-background text-foreground flex flex-col" suppressHydrationWarning>
        <TooltipProvider>
          {children}
          <Toaster position="top-center" richColors />
          <RegisterServiceWorker />
        </TooltipProvider>
      </body>
    </html>
  );
}
