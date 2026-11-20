"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { Button } from "@/components/ui/button";

const SHARE_MESSAGE = "Daftar sebagai peserta Rakernas BMH 2027 melalui tautan berikut:";

// URL dihitung saat diklik (bukan saat render) agar benar di domain mana pun
// dan tidak menimbulkan hydration mismatch. Sengaja tanpa query/data pribadi.
function getShareUrl(): string {
  return `${window.location.origin}/registrasi`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback untuk browser/konteks tanpa Clipboard API (mis. http non-localhost)
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const shareToWhatsApp = () => {
    const text = `${SHARE_MESSAGE}\n${getShareUrl()}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const copyLink = async () => {
    const ok = await copyText(getShareUrl());
    if (ok) {
      toast.success("Tautan pendaftaran disalin.");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Gagal menyalin tautan. Salin manual dari kolom alamat browser.");
    }
  };

  return (
    <section
      aria-label="Bagikan halaman pendaftaran"
      className="mt-6 rounded-2xl border border-border bg-card/60 p-5 text-center md:p-6"
    >
      <h2 className="font-heading text-base font-semibold text-foreground">
        Bagikan halaman pendaftaran
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Ajak rekan Anda mendaftar sebagai peserta.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={shareToWhatsApp}
          className="h-12 gap-2 bg-[#25D366] font-semibold text-brand-green-night hover:bg-[#20BD5A]"
        >
          <WhatsAppIcon className="size-5" />
          Bagikan ke WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={copyLink}
          className="h-12 gap-2"
          aria-live="polite"
        >
          {copied ? (
            <Check className="size-4 text-brand-green" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Tautan disalin" : "Salin tautan"}
        </Button>
      </div>
    </section>
  );
}
