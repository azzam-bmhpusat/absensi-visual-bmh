import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Rakernas BMH 2027",
    short_name: "Rakernas BMH",
    description: "Sistem kehadiran visual cepat dan realtime untuk acara Baitul Maal Hidayatullah (BMH)",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#095046",
    background_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
