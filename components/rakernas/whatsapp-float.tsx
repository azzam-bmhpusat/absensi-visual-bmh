"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { cn } from "cn";

const LOGO_MS = 2000;
const IMAGE_MS = 1000;
const POPUP_SRC = "/whatsapp-popup.jpeg";

/** Pesan pembuka untuk penanggung jawab acara; bagian "..." diisi sendiri oleh pengunjung. */
export const WHATSAPP_TEMPLATE = [
  "Assalamu'alaikum warahmatullahi wabarakatuh.",
  "",
  "Yth. Bapak/Ibu Penanggung Jawab Acara Rakernas BMH,",
  "perkenalkan saya ... dari BMH Perwakilan ...",
  "Saya ingin bertanya terkait ...",
  "",
  "Jazakumullahu khairan.",
].join("\n");

/**
 * Tambahkan template ke tautan WhatsApp (wa.me / api.whatsapp.com) bila belum punya `text`.
 * Tautan non-WhatsApp atau yang sudah berisi pesan dari admin dibiarkan apa adanya.
 */
export function withWhatsAppTemplate(href: string, text = WHATSAPP_TEMPLATE): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }
  const isWhatsApp = url.hostname === "wa.me" || url.hostname === "api.whatsapp.com";
  if (!isWhatsApp || url.searchParams.has("text")) return href;
  // encodeURIComponent (spasi -> %20); "+" dari URLSearchParams bisa tampil apa adanya di WhatsApp.
  const sep = url.search ? "&" : "?";
  return `${url.toString()}${sep}text=${encodeURIComponent(text)}`;
}

/**
 * Popup WhatsApp yang ter-pin di pojok kanan bawah. Logo WhatsApp tampil 2 detik,
 * lalu gambar popup 1 detik, bergantian terus. Klik membuka `href` (footer_url event settings)
 * dengan template pesan untuk penanggung jawab acara.
 * Kedua state berukuran sama (lingkaran 56 px) sehingga tombol tidak berubah ukuran. Gambar di-crop
 * ke wajah dan diberi badge WhatsApp mini agar tetap jelas bahwa ini tombol WhatsApp.
 * Kedua lapisan selalu dirender (gambar ikut ter-preload); pergantian hanya lewat opacity/scale CSS,
 * dan `motion-reduce` menghilangkan efek skala.
 */
export function WhatsAppFloat({ href }: { href: string }) {
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowImage((v) => !v), showImage ? IMAGE_MS : LOGO_MS);
    return () => clearTimeout(timer);
  }, [showImage]);

  const layer =
    "absolute inset-0 rounded-full shadow-lg shadow-black/30 transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-opacity";

  return (
    <a
      href={withWhatsAppTemplate(href)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi panitia via WhatsApp"
      data-state={showImage ? "image" : "logo"}
      className="fixed bottom-4 right-4 z-50 block size-14 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:bottom-6 md:right-6 md:size-16"
    >
      <span
        aria-hidden="true"
        className={cn(
          layer,
          "flex items-center justify-center bg-brand-green text-white ring-2 ring-white",
          showImage ? "scale-90 opacity-0 motion-reduce:scale-100" : "scale-100 opacity-100",
        )}
      >
        <WhatsAppIcon className="size-8 md:size-9" />
      </span>
      <span
        aria-hidden="true"
        className={cn(
          layer,
          showImage ? "scale-100 opacity-100" : "scale-90 opacity-0 motion-reduce:scale-100",
        )}
      >
        <span className="absolute inset-0 overflow-hidden rounded-full ring-2 ring-white">
          <Image
            src={POPUP_SRC}
            alt=""
            fill
            sizes="64px"
            loading="eager"
            className="origin-[45%_37%] scale-[1.8] object-cover object-[45%_30%]"
          />
        </span>
        {/* Badge WhatsApp mini di pojok kanan bawah */}
        <span className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-brand-green text-white ring-2 ring-white">
          <WhatsAppIcon className="size-3" />
        </span>
      </span>
    </a>
  );
}
