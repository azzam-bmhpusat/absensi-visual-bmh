"use client";

import { GuestChip } from "./guest-chip";

export function AttendanceBoard() {
  return (
    <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
      <div className="flex flex-col space-y-4">
        <h2 className="text-3xl font-heading font-semibold text-white border-b-2 border-brand-green pb-2">
          Sudah Hadir
        </h2>
        <div className="space-y-3">
          <GuestChip nama="H. Ahmad Dahlan" perwakilanDaerah="DPW Jawa Timur" status="hadir" />
          <GuestChip nama="M. Syarifuddin" perwakilanDaerah="DPD Surabaya" status="walk-in" />
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <h2 className="text-3xl font-heading font-semibold text-white border-b-2 border-brand-gold pb-2">
          Belum Hadir
        </h2>
        <div className="space-y-3">
          <GuestChip nama="Fathur Rahman" perwakilanDaerah="DPW Jawa Tengah" status="belum" />
        </div>
      </div>
    </div>
  );
}
