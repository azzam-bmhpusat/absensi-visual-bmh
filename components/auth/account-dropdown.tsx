"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { UserAvatar } from "./user-avatar";
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

/** Menu profil di navbar (hanya lingkaran avatar): Dashboard (khusus admin), Profil (/profile) dan Logout. */
export function AccountDropdown({
  name,
  email,
  avatarUrl = null,
  isAdmin = false,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Menu profil ${name || email}`}
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-shadow hover:ring-2 hover:ring-green-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        }
      >
        <UserAvatar src={avatarUrl} name={name || email} className="size-10 text-sm" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl border border-line bg-popover p-1.5 shadow-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 font-normal">
            {name && <span className="block truncate text-sm font-semibold text-ink">{name}</span>}
            <span className="block truncate text-xs text-ink-muted">{email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem
            render={<Link href="/dashboard" />}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink focus:bg-secondary focus:text-primary"
          >
            <LayoutDashboard className="size-4" />
            Dashboard
          </DropdownMenuItem>
        )}
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
