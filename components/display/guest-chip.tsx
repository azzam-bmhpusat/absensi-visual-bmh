import { Check, Clock } from "lucide-react";
import { RandomAvatar } from "./random-avatar";
import { formatAttendanceDateTime, formatGuestAffiliation } from "@/lib/display-helpers";

interface GuestChipProps {
  nama: string;
  perwakilanDaerah: string;
  jabatan?: string | null;
  kategori?: string | null;
  status: "hadir" | "belum" | "walk-in";
  isRecent?: boolean;
  checkedInAt?: string;
}

export function GuestChip({
  nama,
  perwakilanDaerah,
  jabatan,
  kategori,
  status,
  isRecent = false,
  checkedInAt,
}: GuestChipProps) {
  const affiliationLabel = formatGuestAffiliation({
    perwakilan_daerah: perwakilanDaerah,
    jabatan,
    kategori,
  });

  if (status === "belum") {
    return (
      <div className="min-h-[76px] xl:min-h-[82px] rounded-2xl px-5 py-2 border border-[#1F6252] bg-transparent flex flex-col justify-center min-w-0 transition-colors">
        <span className="text-lg xl:text-xl font-heading font-semibold text-[#A9CFC2] truncate leading-tight">
          {nama}
        </span>
        <span className="text-sm xl:text-base text-[#A9CFC2]/70 truncate leading-tight mt-0.5">
          {affiliationLabel}
        </span>
      </div>
    );
  }

  const formattedTime = checkedInAt
    ? formatAttendanceDateTime(checkedInAt)
    : null;

  return (
    <div
      className={`relative overflow-hidden min-h-[76px] xl:min-h-[82px] rounded-2xl px-4 xl:px-5 py-2.5 bg-[#095046] text-white flex items-center justify-between shadow-sm min-w-0 border transition-[border-color,box-shadow] duration-300 ${isRecent
          ? "chip-new border-brand-gold-soft ring-1 ring-brand-gold-soft"
          : "border-border/20"
        }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
        {/* Avatar Random Vektor dengan Badge Centang */}
        <div className="relative shrink-0">
          <RandomAvatar name={nama} size={44} />
          <div className={`${isRecent ? "chip-new-check " : ""}absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center shadow-2xs border-2 border-[#095046]`}>
            <Check className="w-3 h-3 text-[#0A3A30] stroke-[3]" />
          </div>
        </div>

        {/* Info Tamu & Waktu Kehadiran */}
        <div className="truncate flex-1 space-y-0.5">
          <div className="text-base xl:text-lg font-heading font-bold truncate leading-tight text-white">
            {nama}
          </div>
          <div className="text-xs xl:text-sm text-[#A9CFC2] truncate leading-tight">
            {affiliationLabel}
          </div>
          {formattedTime && (
            <div className="text-[11px] xl:text-xs font-mono text-brand-gold-soft flex items-center gap-1.5 truncate leading-tight pt-0.5">
              <Clock className="w-3 h-3 shrink-0 text-brand-gold-soft" />
              <span className="truncate">{formattedTime}</span>
            </div>
          )}
        </div>
      </div>

      {status === "walk-in" && (
        <span className="text-xs xl:text-sm font-semibold px-2.5 py-1 rounded-full bg-brand-gold-soft text-[#0A3A30] shrink-0 shadow-sm whitespace-nowrap">
          Tamu baru
        </span>
      )}
    </div>
  );
}
