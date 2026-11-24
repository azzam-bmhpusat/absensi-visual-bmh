"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan /sw.js agar aplikasi bisa di-install (PWA) dan punya halaman offline.
 * Hanya di production: di `next dev` service worker tidak berguna (bisa menyajikan halaman basi)
 * dan pendaftarannya bisa gagal, jadi worker sisa dari build sebelumnya dilepas.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((r) => r.unregister())))
        .catch(() => {});
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((error) => console.error("Gagal mendaftarkan service worker", error));
  }, []);

  return null;
}
