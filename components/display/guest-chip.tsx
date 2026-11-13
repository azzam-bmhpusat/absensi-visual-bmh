import { Check } from "lucide-react";

interface GuestChipProps {
  nama: string;
  perwakilanDaerah: string;
  status: "hadir" | "belum" | "walk-in";
  isRecent?: boolean;
}

export function GuestChip({
  nama,
  perwakilanDaerah,
  status,
  isRecent,
}: GuestChipProps) {
  if (status === "belum") {
    return (
      <div className="h-[72px] rounded-2xl px-6 border border-[#1F6252] bg-transparent flex flex-col justify-center">
        <span className="text-xl font-semibold text-[#A9CFC2] truncate">{nama}</span>
        <span className="text-sm text-[#A9CFC2]/70 truncate">{perwakilanDaerah}</span>
      </div>
    );
  }

  return (
    <div
      className={`h-[72px] rounded-2xl px-6 bg-[#134B40] text-white flex items-center justify-between shadow-sm transition-all ${
        isRecent ? "ring-2 ring-brand-gold-soft" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-6 h-6 rounded-full bg-brand-green flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-[#0A3A30]" />
        </div>
        <div className="truncate">
          <div className="text-xl font-semibold truncate">{nama}</div>
          <div className="text-sm text-[#A9CFC2] truncate">{perwakilanDaerah}</div>
        </div>
      </div>
      {status === "walk-in" && (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-gold-soft text-[#0A3A30] shrink-0">
          Tamu baru
        </span>
      )}
    </div>
  );
}
