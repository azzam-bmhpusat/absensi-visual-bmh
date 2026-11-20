"use client";

import Link from "next/link";
import { useTransition } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { logoutUser } from "@/app/(site)/login/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Menu profil di navbar: Profil (/profile) dan Logout. */
export function AccountDropdown({ name, email }: { name: string; email: string }) {
  const [isPending, startTransition] = useTransition();
  const initial = (name || email).trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Menu profil"
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-green-100 font-heading text-xs font-bold text-primary">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate sm:inline">{name || email}</span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl border border-line bg-popover p-1.5 shadow-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate px-3 py-2 text-xs font-normal text-ink-muted">{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/profile" />}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink focus:bg-secondary focus:text-primary"
        >
          <UserRound className="size-4" />
          Profil
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => startTransition(() => logoutUser())}
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink focus:bg-secondary focus:text-primary"
        >
          <LogOut className="size-4" />
          {isPending ? "Keluar..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
