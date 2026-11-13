"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { UserPlus, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GuestItem {
  id: string;
  nama: string;
  perwakilan_daerah: string;
}

interface NameComboboxProps {
  guests: GuestItem[];
  value: string;
  onChange: (value: string) => void;
  onGuestSelect: (guest: GuestItem | null) => void;
  disabled?: boolean;
}

export function NameCombobox({
  guests,
  value,
  onChange,
  onGuestSelect,
  disabled,
}: NameComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? guests.filter((g) =>
        g.nama.toLowerCase().includes(search.toLowerCase())
      )
    : guests;

  const hasExactMatch = guests.some(
    (g) => g.nama.toLowerCase() === search.trim().toLowerCase()
  );

  function handleSelectGuest(guest: GuestItem) {
    onChange(guest.nama);
    onGuestSelect(guest);
    setSearch("");
    setOpen(false);
  }

  function handleWalkIn() {
    const trimmed = search.trim();
    if (trimmed.length >= 2) {
      onChange(trimmed);
      onGuestSelect(null);
      setSearch("");
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-base ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left cursor-pointer",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{value || "Cari nama peserta..."}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2.5rem)] max-w-[392px] p-0 rounded-xl shadow-lg border-line"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Ketik nama..."
            value={search}
            onValueChange={(val) => {
              setSearch(val);
            }}
          />
          <CommandList className="max-h-60 overflow-y-auto">
            {filtered.length === 0 && search.trim().length < 2 && (
              <CommandEmpty className="py-4 text-center text-sm text-ink-muted">
                Tidak ada nama tamu ditemukan.
              </CommandEmpty>
            )}

            <CommandGroup>
              {filtered.slice(0, 30).map((guest) => {
                const isSelected = value === guest.nama;
                return (
                  <CommandItem
                    key={guest.id}
                    onSelect={() => handleSelectGuest(guest)}
                    className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-secondary rounded-lg"
                  >
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-foreground text-sm">
                        {guest.nama}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {guest.perwakilan_daerah}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-brand-green shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Opsi tamu dadakan (walk-in) */}
            {search.trim().length >= 2 && !hasExactMatch && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleWalkIn}
                  className="py-2.5 px-3 cursor-pointer hover:bg-gold-50 text-brand-gold-text font-medium rounded-lg flex items-center gap-2 border-t border-line/50 mt-1"
                >
                  <UserPlus className="h-4 w-4 text-brand-gold-text shrink-0" />
                  <span className="truncate">
                    Gunakan &apos;{search.trim()}&apos; (tamu baru)
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
