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
  isRecent = false,
}: GuestChipProps) {
  if (status === "belum") {
    return (
      <div className="h-[72px] rounded-2xl px-6 border border-[#1F6252] bg-transparent flex flex-col justify-center min-w-0 transition-colors">
        <span className="text-xl font-heading font-semibold text-[#A9CFC2] truncate leading-tight">
          {nama}
        </span>
        <span className="text-base text-[#A9CFC2]/70 truncate leading-tight">
          {perwakilanDaerah}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`h-[72px] rounded-2xl px-6 bg-[#134B40] text-white flex items-center justify-between shadow-sm min-w-0 transition-all duration-300 ${
        isRecent
          ? "ring-2 ring-brand-gold-soft shadow-[0_0_20px_rgba(242,208,107,0.35)] scale-[1.01]"
          : "border border-border/20"
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-2">
        <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center shrink-0 shadow-sm">
          <Check className="w-4 h-4 text-[#0A3A30] stroke-[3]" />
        </div>
        <div className="truncate flex-1">
          <div className="text-xl font-heading font-semibold truncate leading-tight text-white">
            {nama}
          </div>
          <div className="text-base text-[#A9CFC2] truncate leading-tight">
            {perwakilanDaerah}
          </div>
        </div>
      </div>

      {status === "walk-in" && (
        <span className="text-sm font-semibold px-3 py-1 rounded-full bg-brand-gold-soft text-[#0A3A30] shrink-0 shadow-sm whitespace-nowrap">
          Tamu baru
        </span>
      )}
    </div>
  );
}
