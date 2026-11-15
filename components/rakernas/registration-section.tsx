"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, MessageCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { REGISTRATION_DATA } from "@/content/rakernas";

export function RegistrationSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(REGISTRATION_DATA.bank.accountNumber);
      }
      setCopied(true);
      toast.success("Nomor rekening tersalin");
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  return (
    <div className="mx-auto w-full max-w-screen-xl px-5 md:px-8">
      {/* Header Bagian */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/20 px-3 py-1 text-xs font-semibold text-brand-green">
          <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Alur Registrasi</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-heading font-semibold text-brand-gold-soft tracking-tight">
          {REGISTRATION_DATA.title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Ikuti empat langkah mudah di bawah ini untuk mengamankan kepesertaan Anda di Rakernas BMH 2027.
        </p>
      </div>

      {/* 4 Langkah Pendaftaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-10 md:mt-14">
        {REGISTRATION_DATA.steps.map((step, index) => {
          const stepNumber = index + 1;
          return (
            <div
              key={stepNumber}
              className="rounded-2xl border border-line/15 bg-card/40 backdrop-blur p-5 md:p-6 flex flex-col justify-between transition-all hover:border-brand-green/40 shadow-sm"
            >
              <div>
                <div className="h-10 w-10 rounded-full bg-brand-green text-brand-green-night font-heading font-bold text-base flex items-center justify-center mb-4 shrink-0 shadow-sm">
                  {stepNumber}
                </div>
                <p className="text-sm md:text-base text-foreground font-medium leading-snug">
                  {step}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-line/10 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Langkah 0{stepNumber}
              </div>
            </div>
          );
        })}
      </div>

      {/* Kartu Rekening Pembayaran */}
      <Card className="border-2 border-brand-gold bg-card/60 backdrop-blur max-w-2xl mx-auto mt-10 md:mt-14 text-center shadow-xl rounded-2xl overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            {REGISTRATION_DATA.bank.label}
          </p>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            {REGISTRATION_DATA.bank.bankName}
          </h3>

          {/* Nomor Rekening + Tombol Salin */}
          <div className="py-2 flex items-center justify-center gap-3 flex-wrap">
            <span className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-brand-gold-soft tabular-nums tracking-wider select-all">
              {REGISTRATION_DATA.bank.accountNumber}
            </span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={handleCopy}
                    aria-label="Salin nomor rekening"
                    className="h-11 w-11 shrink-0 rounded-lg bg-card/80 text-foreground hover:bg-brand-green hover:text-brand-green-night transition-colors border border-brand-gold/40"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-brand-green" aria-hidden="true" />
                    ) : (
                      <Copy className="h-5 w-5" aria-hidden="true" />
                    )}
                  </Button>
                }
              />
              <TooltipContent>Salin nomor</TooltipContent>
            </Tooltip>
          </div>

          <p className="text-sm md:text-base text-muted-foreground font-medium">
            {REGISTRATION_DATA.bank.accountHolder}
          </p>
        </CardContent>
      </Card>

      {/* Dua Tombol Aksi Pendaftaran */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:mt-10 max-w-xl mx-auto w-full">
        <Button
          nativeButton={false}
          render={
            <a
              href={REGISTRATION_DATA.actions.form.url}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          className="h-12 w-full sm:w-auto px-8 bg-brand-gold-soft text-brand-green-night hover:bg-brand-gold font-heading font-semibold text-base rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
        >
          <span>{REGISTRATION_DATA.actions.form.label}</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </Button>

        <Button
          nativeButton={false}
          render={
            <a
              href={REGISTRATION_DATA.actions.confirm.url}
              target="_blank"
              rel="noopener noreferrer"
            />
          }
          variant="outline"
          className="h-12 w-full sm:w-auto px-8 border-2 border-white/80 text-white bg-transparent hover:bg-white/10 hover:text-white font-heading font-semibold text-base rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          <span>{REGISTRATION_DATA.actions.confirm.label}</span>
        </Button>
      </div>
    </div>
  );
}
