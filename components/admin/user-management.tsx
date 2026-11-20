"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Shuffle,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createUserAction,
  deleteUserAction,
  setUserActiveAction,
  updateUserAction,
  type UserActionResult,
} from "@/app/(admin)/manajemen-user/actions";
import { formatUserDate, type UserRow } from "@/lib/user-row";
import { generatePassword, ROLE_LABEL, USER_ROLES, type UserRole } from "@/lib/user-schema";

type Filter = "all" | UserRole | "inactive";

const ROLE_STYLE: Record<UserRole, string> = {
  admin: "bg-secondary text-brand-green-deep border-brand-green/30",
  user: "bg-gold-100 text-brand-gold-text border-brand-gold/40",
};

interface UserManagementProps {
  users: UserRow[];
  currentUserId: string;
}

export function UserManagement({ users, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      user: users.filter((u) => u.role === "user").length,
      inactive: users.filter((u) => u.banned).length,
    }),
    [users]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "inactive" ? !u.banned : filter !== "all" && u.role !== filter) return false;
      return !q || u.email.toLowerCase().includes(q);
    });
  }, [users, filter, search]);

  const finish = (res: UserActionResult, onSuccess?: () => void) => {
    if (res.success) {
      toast.success(res.message ?? "Berhasil.");
      onSuccess?.();
      router.refresh();
    } else {
      toast.error(res.error ?? "Terjadi kesalahan.");
    }
  };

  const toggleActive = (user: UserRow) => {
    setBusyId(user.id);
    startTransition(async () => {
      const res = await setUserActiveAction(user.id, user.banned);
      setBusyId(null);
      finish(res);
    });
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const target = toDelete;
    setBusyId(target.id);
    startTransition(async () => {
      const res = await deleteUserAction(target.id);
      setBusyId(null);
      finish(res, () => setToDelete(null));
    });
  };

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "admin", label: "Admin" },
    { value: "user", label: "User" },
    { value: "inactive", label: "Nonaktif" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email..."
            aria-label="Cari email pengguna"
            className="h-10 rounded-xl border-line pl-9 text-xs focus-visible:ring-ring"
          />
        </div>
        <Button
          type="button"
          onClick={() => setCreating(true)}
          className="h-11 gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-green-night"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tambah User
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter pengguna">
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-line bg-white text-ink-muted hover:border-ring"
              )}
            >
              {f.label}
              <span className={cn("tabular-nums", active ? "text-primary-foreground/80" : "text-ink-muted")}>
                {counts[f.value]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="text-xs font-semibold text-primary">Email</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Peran</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Terakhir masuk</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Dibuat</TableHead>
              <TableHead className="text-right text-xs font-semibold text-primary">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-ink-muted">
                  Tidak ada pengguna yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id && isPending;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="min-w-56 text-sm font-medium text-ink">
                      <span className="break-all">{u.email}</span>
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Anda
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", ROLE_STYLE[u.role])}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                          u.banned ? "border-red-200 bg-red-50 text-danger" : "border-brand-green/30 bg-secondary text-brand-green-deep"
                        )}
                      >
                        {u.banned ? "Nonaktif" : "Aktif"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-ink-muted">{formatUserDate(u.lastSignInAt)}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-ink-muted">{formatUserDate(u.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-lg text-primary hover:bg-secondary"
                          aria-label={`Edit ${u.email}`}
                          onClick={() => setEditing(u)}
                          disabled={busy}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-lg text-primary hover:bg-secondary"
                          aria-label={u.banned ? `Aktifkan ${u.email}` : `Nonaktifkan ${u.email}`}
                          title={isSelf ? "Tidak dapat menonaktifkan akun sendiri" : u.banned ? "Aktifkan akun" : "Nonaktifkan akun"}
                          onClick={() => toggleActive(u)}
                          disabled={busy || (isSelf && !u.banned)}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-11 rounded-lg text-danger hover:bg-red-50"
                          aria-label={`Hapus ${u.email}`}
                          title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus akun"}
                          onClick={() => setToDelete(u)}
                          disabled={busy || isSelf}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} finish={finish} />
      <EditUserDialog
        key={editing?.id ?? "none"}
        user={editing}
        isSelf={editing?.id === currentUserId}
        onClose={() => setEditing(null)}
        finish={finish}
      />

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-danger">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Hapus akun?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Akun <strong className="text-ink">{toDelete?.email}</strong> akan dihapus permanen dan tidak bisa login lagi.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setToDelete(null)}>
              Batal
            </Button>
            <Button
              type="button"
              className="h-11 gap-2 rounded-xl bg-danger text-white hover:bg-danger/90"
              onClick={confirmDelete}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type FinishFn = (res: UserActionResult, onSuccess?: () => void) => void;

function RoleChoice({
  value,
  onChange,
  disabled,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Peran" className="grid grid-cols-2 gap-2">
      {USER_ROLES.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          disabled={disabled}
          onClick={() => onChange(r)}
          className={cn(
            "h-11 rounded-xl border text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            value === r ? "border-primary bg-primary text-primary-foreground" : "border-line bg-white text-ink hover:border-ring"
          )}
        >
          {ROLE_LABEL[r]}
        </button>
      ))}
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  optional,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Kata sandi disalin.");
    } catch {
      toast.error("Tidak dapat menyalin. Salin manual.");
    }
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-primary">
        {optional ? "Kata sandi baru (opsional)" : "Kata sandi"}
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          placeholder={optional ? "Kosongkan bila tidak diubah" : "Minimal 8 karakter"}
          className="h-11 rounded-xl border-line font-mono text-sm focus-visible:ring-ring"
        />
        <Button type="button" variant="outline" size="icon" className="size-11 shrink-0 rounded-xl" onClick={() => setShown((s) => !s)} aria-label={shown ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>
          {shown ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" className="h-9 gap-1.5 rounded-lg text-xs" onClick={() => { onChange(generatePassword()); setShown(true); }}>
          <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
          Buat acak
        </Button>
        <Button type="button" variant="outline" className="h-9 gap-1.5 rounded-lg text-xs" onClick={copy} disabled={!value}>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Salin
        </Button>
      </div>
    </div>
  );
}

function CreateUserDialog({ open, onClose, finish }: { open: boolean; onClose: () => void; finish: FinishFn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setPassword("");
    setRole("user");
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction({ email, password, role });
      finish(res, close);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary">Tambah User</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Buat akun baru. Bagikan kata sandi kepada pengguna secara aman; akun langsung aktif tanpa verifikasi email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-email" className="text-xs font-semibold text-primary">Email</Label>
            <Input
              id="new-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              placeholder="nama@bmh.or.id"
              required
              className="h-11 rounded-xl border-line focus-visible:ring-ring"
            />
          </div>
          <PasswordField id="new-user-password" value={password} onChange={setPassword} />
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-primary">Peran</Label>
            <RoleChoice value={role} onChange={setRole} />
            <p className="text-[11px] text-ink-muted">Admin dapat mengelola seluruh panel, termasuk akun lain.</p>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={close}>Batal</Button>
            <Button type="submit" className="h-11 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-green-night" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Buat akun
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  isSelf,
  onClose,
  finish,
}: {
  user: UserRow | null;
  isSelf: boolean;
  onClose: () => void;
  finish: FinishFn;
}) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [password, setPassword] = useState("");
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const changes: { email?: string; role?: UserRole; password?: string } = {};
    if (email.trim().toLowerCase() !== user.email) changes.email = email;
    if (role !== user.role) changes.role = role;
    if (password) changes.password = password;
    if (Object.keys(changes).length === 0) {
      toast.info("Tidak ada perubahan.");
      return;
    }
    startTransition(async () => {
      const res = await updateUserAction(user.id, changes);
      finish(res, onClose);
    });
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary">Edit pengguna</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Ubah email, peran, atau atur ulang kata sandi. Kosongkan kata sandi bila tidak ingin mengubahnya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-user-email" className="text-xs font-semibold text-primary">Email</Label>
            <Input
              id="edit-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl border-line focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-primary">Peran</Label>
            <RoleChoice value={role} onChange={setRole} disabled={isSelf} />
            {isSelf && <p className="text-[11px] text-ink-muted">Anda tidak dapat mengubah peran akun Anda sendiri.</p>}
          </div>
          <PasswordField id="edit-user-password" value={password} onChange={setPassword} optional />
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose}>Batal</Button>
            <Button type="submit" className="h-11 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-green-night" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
