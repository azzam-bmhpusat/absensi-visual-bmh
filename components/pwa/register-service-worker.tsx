"use client";

import { useEffect } from "react";

/** Mendaftarkan /sw.js agar aplikasi bisa di-install (PWA) dan punya halaman offline. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Gagal mendaftarkan service worker", error));
  }, []);

  return null;
}
