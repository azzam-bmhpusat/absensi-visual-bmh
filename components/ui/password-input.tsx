"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";

/**
 * Kolom kata sandi dengan tombol mata untuk menampilkan/menyembunyikan isinya.
 * @param defaultVisible Tampilkan isi sejak awal (mis. kode akses yang memang perlu terlihat).
 */
function PasswordInput({
  className,
  defaultVisible = false,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type"> & { defaultVisible?: boolean }) {
  const [visible, setVisible] = React.useState(defaultVisible);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("pr-11", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
        aria-pressed={visible}
        aria-controls={props.id}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-ink-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        <Icon className="size-[18px]" aria-hidden="true" />
      </button>
    </div>
  );
}

export { PasswordInput };
