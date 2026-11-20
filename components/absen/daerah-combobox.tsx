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
import { ChevronsUpDown, Check, MapPin, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DaerahComboboxProps {
  daerahList: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DaerahCombobox({
  daerahList,
  value,
  onChange,
  disabled,
}: DaerahComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? daerahList.filter((d) =>
        d.toLowerCase().includes(search.toLowerCase())
      )
    : daerahList;

  const hasExactMatch = daerahList.some(
    (d) => d.toLowerCase() === search.trim().toLowerCase()
  );

  function handleSelect(daerah: string) {
    onChange(daerah);
    setSearch("");
    setOpen(false);
  }

  function handleCustomInput() {
    const trimmed = search.trim();
    if (trimmed.length >= 2) {
      onChange(trimmed);
      setSearch("");
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-base ring-offset-background transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-muted text-left cursor-pointer",
          !value && "text-muted-foreground"
        )}
      >
        <span className="truncate">{value || "Ketik atau pilih daerah..."}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2.5rem)] max-w-[392px] p-0 rounded-xl shadow-lg border-line"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Cari atau ketik nama daerah..."
            value={search}
            onValueChange={(val) => {
              setSearch(val);
            }}
          />
          <CommandList data-lenis-prevent className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && search.trim().length < 2 && (
              <CommandEmpty className="py-4 text-center text-sm text-ink-muted">
                Tidak ada daerah ditemukan. Ketik untuk membuat baru.
              </CommandEmpty>
            )}

            <CommandGroup>
              {filtered.map((daerah) => {
                const isSelected = value === daerah;
                return (
                  <CommandItem
                    key={daerah}
                    onSelect={() => handleSelect(daerah)}
                    className="flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-secondary rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-ink-muted shrink-0" />
                      <span className="text-sm font-medium text-foreground">
                        {daerah}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-brand-green-text shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {/* Opsi ketik bebas jika tidak sama persis */}
            {search.trim().length >= 2 && !hasExactMatch && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCustomInput}
                  className="py-2.5 px-3 cursor-pointer hover:bg-gold-50 text-brand-gold-text font-medium rounded-lg flex items-center gap-2 border-t border-line/50 mt-1"
                >
                  <Plus className="h-4 w-4 text-brand-gold-text shrink-0" />
                  <span className="truncate">
                    Gunakan &apos;{search.trim()}&apos;
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
