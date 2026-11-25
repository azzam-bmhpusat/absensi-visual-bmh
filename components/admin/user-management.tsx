"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Filter as FilterIcon,
  Layers,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Shuffle,
  Trash2,
  Upload,
  UserRound,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createUserAction,
  deleteUserAction,
  importUsersAction,
  type ImportUsersResult,
  setUserActiveAction,
  updateUserAction,
  type UserActionResult,
} from "@/app/(admin)/manajemen-user/actions";
import {
  ALL_JABATAN,
  filterUsers,
  formatUserDate,
  type UserFilter,
  type UserProfile,
  type UserRow,
  type UserStatusFilter,
} from "@/lib/user-row";
import { downloadFromEndpoint } from "@/lib/download-file";
import { avatarPublicUrl } from "@/lib/avatar";
import { UserAvatar } from "@/components/auth/user-avatar";
import {
  ADMIN_PROFILE_FIELDS,
  formatArrival,
  isoToWibLocal,
  isProfileComplete,
  PROFILE_STATUS_LABEL,
  profileStatus,
  type ProfileStatus,
  whatsappLink,
  wibLocalToIso,
  type AdminProfileInput,
} from "@/lib/profile-contact";
import { MODE_KEHADIRAN, MODE_KEHADIRAN_LABEL, UKURAN_BAJU } from "@/lib/participant-options";
import { DEFAULT_ROLE, generatePassword, ROLE_LABEL, USER_ROLES, type UserRole } from "@/lib/user-schema";

type Filter = UserStatusFilter;

const EXPORT_ENDPOINT = "/api/admin/manajemen-user/export";
const IMPORT_TEMPLATE_ENDPOINT = "/api/admin/manajemen-user/import-template";

function buildUserExportUrl(mode: "all" | "filter", filter: UserFilter): string {
  const params = new URLSearchParams({ mode });
  if (mode === "filter") {
    params.set("status", filter.status);
    params.set("jabatan", filter.jabatan);
    if (filter.q.trim()) params.set("q", filter.q.trim());
  }
  return `${EXPORT_ENDPOINT}?${params.toString()}`;
}

const menuItemClassName =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium text-ink focus:bg-secondary focus:text-primary";

const ROLE_STYLE: Record<UserRole, string> = {
  admin: "bg-secondary text-brand-green-deep border-brand-green/30",
  direktur: "bg-primary/10 text-primary border-primary/30",
  peserta: "bg-gold-100 text-brand-gold-text border-brand-gold/40",
  user: "bg-white text-ink-muted border-line",
};

const PROFILE_STATUS_STYLE: Record<ProfileStatus, string> = {
  complete: "border-brand-green/30 bg-secondary text-brand-green-deep",
  progress: "border-brand-gold/40 bg-gold-100 text-brand-gold-text",
  empty: "border-line bg-white text-ink-muted",
};

function ProfileStatusBadge({ profile }: { profile: UserProfile }) {
  const { status, filled, total } = profileStatus(profile);
  return (
    <span
      className={cn("inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", PROFILE_STATUS_STYLE[status])}
      title={`${filled} dari ${total} data profil terisi`}
    >
      {PROFILE_STATUS_LABEL[status]}
      {status === "progress" && <span className="ml-1 tabular-nums">{filled}/{total}</span>}
    </span>
  );
}

interface UserManagementProps {
  users: UserRow[];
  currentUserId: string;
}

export function UserManagement({ users, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [toDelete, setToDelete] = useState<UserRow | null>(null);
  const [viewing, setViewing] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      direktur: users.filter((u) => u.role === "direktur").length,
      peserta: users.filter((u) => u.role === "peserta").length,
      user: users.filter((u) => u.role === "user").length,
      inactive: users.filter((u) => u.banned).length,
    }),
    [users]
  );

  const visible = useMemo(
    () => filterUsers(users, { status: filter, jabatan: ALL_JABATAN, q: search }),
    [users, filter, search]
  );

  const [exporting, setExporting] = useState<"all" | "filter" | null>(null);
  const runExport = async (mode: "all" | "filter") => {
    if (exporting) return;
    setExporting(mode);
    try {
      await downloadFromEndpoint(
        buildUserExportUrl(mode, { status: filter, jabatan: ALL_JABATAN, q: search }),
        "manajemen-user-bmh.xlsx"
      );
      toast.success(`Excel ${mode === "all" ? "semua user" : "sesuai filter"} berhasil diunduh.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengekspor Excel.");
    } finally {
      setExporting(null);
    }
  };

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
    { value: "direktur", label: "Direktur" },
    { value: "peserta", label: "Peserta" },
    { value: "user", label: "User" },
    { value: "inactive", label: "Nonaktif" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, daerah, jabatan, no. WA..."
              aria-label="Cari pengguna"
              className="h-10 rounded-xl border-line pl-9 text-xs focus-visible:ring-ring"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={exporting !== null}
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-line bg-white px-4 text-sm font-semibold text-primary hover:bg-secondary data-popup-open:bg-secondary"
                />
              }
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
              )}
              Export Excel
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="w-64 rounded-xl border border-line bg-popover p-1.5 shadow-lg"
            >
              <DropdownMenuItem className={menuItemClassName} onClick={() => runExport("all")}>
                <Layers className="size-4" aria-hidden="true" />
                Semua user
                <span className="ml-auto tabular-nums text-ink-muted">{users.length}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className={menuItemClassName}
                disabled={visible.length === 0}
                onClick={() => runExport("filter")}
              >
                <FilterIcon className="size-4" aria-hidden="true" />
                Sesuai filter
                <span className="ml-auto tabular-nums text-ink-muted">{visible.length}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            type="button"
            variant="outline"
            onClick={() => setImporting(true)}
            className="h-11 gap-2 rounded-xl border-line bg-white px-4 text-sm font-semibold text-primary hover:bg-secondary"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            Import Excel
          </Button>
          <Button
            type="button"
            onClick={() => setCreating(true)}
            className="h-11 gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-green-night"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Tambah User
          </Button>
        </div>
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
              <TableHead className="w-12 text-xs font-semibold text-primary">No.</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Nama</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Email</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Jabatan</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Perwakilan daerah</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Status profil</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Peran</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Status</TableHead>
              <TableHead className="text-xs font-semibold text-primary">Terakhir masuk</TableHead>
              <TableHead className="text-right text-xs font-semibold text-primary">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-ink-muted">
                  Tidak ada pengguna yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((u, index) => {
                const isSelf = u.id === currentUserId;
                const busy = busyId === u.id && isPending;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs tabular-nums text-ink-muted">{index + 1}</TableCell>
                    <TableCell className={cn("min-w-48 text-sm", u.profile.nama ? "text-ink" : "text-ink-muted")}>
                      <span className="flex items-center gap-2.5">
                        <UserAvatar src={avatarPublicUrl(u.profile.avatar_url)} name={u.profile.nama ?? u.email} />
                        {u.profile.nama ?? (u.profile.nama_google ? `${u.profile.nama_google} (Google)` : "—")}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-56 text-sm font-medium text-ink">
                      <span className="break-all">{u.email}</span>
                      {isSelf && (
                        <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                          Anda
                        </span>
                      )}
                    </TableCell>
                    <TableCell className={cn("min-w-32 text-xs", u.profile.jabatan ? "text-ink" : "text-ink-muted")}>
                      {u.profile.jabatan ?? "—"}
                    </TableCell>
                    <TableCell className={cn("min-w-32 text-xs", u.profile.perwakilan_daerah ? "text-ink" : "text-ink-muted")}>
                      {u.profile.perwakilan_daerah ?? "—"}
                    </TableCell>
                    <TableCell>
                      <ProfileStatusBadge profile={u.profile} />
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
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            disabled={busy}
                            render={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-11 rounded-lg text-primary hover:bg-secondary"
                                aria-label={`Aksi untuk ${u.email}`}
                              />
                            }
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                            )}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            sideOffset={4}
                            className="w-64 rounded-xl border border-line bg-popover p-1.5 shadow-lg [&_[data-slot=dropdown-menu-item]]:whitespace-nowrap"
                          >
                            <DropdownMenuItem className={menuItemClassName} onClick={() => setViewing(u)}>
                              <UserRound className="size-4" aria-hidden="true" />
                              Lihat Detail Profil
                            </DropdownMenuItem>
                            <DropdownMenuItem className={menuItemClassName} onClick={() => setEditing(u)}>
                              <Pencil className="size-4" aria-hidden="true" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={menuItemClassName}
                              disabled={isSelf && !u.banned}
                              onClick={() => toggleActive(u)}
                            >
                              <Power className="size-4" aria-hidden="true" />
                              {u.banned ? "Aktifkan akun" : "Nonaktifkan akun"}
                              {isSelf && !u.banned && <span className="ml-auto text-[11px] text-ink-muted">akun Anda</span>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm font-medium"
                              disabled={isSelf}
                              onClick={() => setToDelete(u)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Hapus akun
                              {isSelf && <span className="ml-auto text-[11px] text-ink-muted">akun Anda</span>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
      <ImportUsersDialog
        open={importing}
        onClose={() => setImporting(false)}
        onImported={() => router.refresh()}
      />
      <ProfileDetailDialog
        user={viewing}
        onClose={() => setViewing(null)}
        onEdit={(u) => {
          setViewing(null);
          setEditing(u);
        }}
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
    <div role="radiogroup" aria-label="Peran" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

type ProfileField = (typeof ADMIN_PROFILE_FIELDS)[number];
/** Nilai form profil (semua string; rencana_kedatangan dalam format datetime-local WIB). */
type ProfileDraft = Record<ProfileField, string>;

function profileToDraft(profile: UserProfile | null | undefined): ProfileDraft {
  return Object.fromEntries(
    ADMIN_PROFILE_FIELDS.map((f) => [
      f,
      f === "rencana_kedatangan" ? isoToWibLocal(profile?.[f]) : (profile?.[f] ?? ""),
    ])
  ) as ProfileDraft;
}

/** Field yang nilainya berbeda dari `base` (untuk create: base kosong -> hanya field yang diisi). */
function profileChanges(draft: ProfileDraft, base: ProfileDraft): Partial<AdminProfileInput> {
  return Object.fromEntries(
    ADMIN_PROFILE_FIELDS.filter((f) => draft[f].trim() !== base[f].trim()).map((f) => [f, draft[f]])
  ) as Partial<AdminProfileInput>;
}

const EMPTY_DRAFT = profileToDraft(null);
const dialogClassName = "max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:max-w-2xl";
const fieldInputClassName = "h-11 rounded-xl border-line focus-visible:ring-ring";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="border-b border-line pb-1.5 text-xs font-bold tracking-wide text-ink-muted uppercase">{children}</h3>;
}

function ProfileFields({
  idPrefix,
  value,
  onChange,
  disabled,
}: {
  idPrefix: string;
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
  disabled?: boolean;
}) {
  const set = (field: ProfileField) => (v: string) => onChange({ ...value, [field]: v });
  const text = (field: ProfileField, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`${idPrefix}-${field}`} className="text-xs font-semibold text-primary">{label}</Label>
      <Input
        id={`${idPrefix}-${field}`}
        value={value[field]}
        onChange={(e) => set(field)(e.target.value)}
        maxLength={100}
        disabled={disabled}
        className={fieldInputClassName}
        {...props}
      />
    </div>
  );
  const arrival = formatArrival(wibLocalToIso(value.rencana_kedatangan));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {text("nama", "Nama lengkap (beserta gelar)")}
        {text("perwakilan_daerah", "Perwakilan Daerah")}
        {text("jabatan", "Jabatan")}
        {text("kategori", "Kategori", { placeholder: "mis. daerah / pusat" })}
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-ukuran_baju`} className="text-xs font-semibold text-primary">Ukuran Baju</Label>
          <select
            id={`${idPrefix}-ukuran_baju`}
            value={value.ukuran_baju}
            onChange={(e) => set("ukuran_baju")(e.target.value)}
            disabled={disabled}
            className="h-11 w-full rounded-xl border border-line bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            <option value="">Belum diisi</option>
            {UKURAN_BAJU.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        {text("no_whatsapp", "No WhatsApp", { type: "tel", inputMode: "tel", placeholder: "081234567890", maxLength: 20 })}
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-rencana_kedatangan`} className="text-xs font-semibold text-primary">Rencana Kedatangan (WIB)</Label>
          <Input
            id={`${idPrefix}-rencana_kedatangan`}
            type="datetime-local"
            value={value.rencana_kedatangan}
            onChange={(e) => set("rencana_kedatangan")(e.target.value)}
            disabled={disabled}
            className={fieldInputClassName}
          />
          {arrival && <p className="text-[11px] text-ink-muted">{arrival}</p>}
        </div>
      </div>
      <fieldset className="space-y-1.5" disabled={disabled}>
        <legend className="text-xs font-semibold text-primary">Keterangan Kehadiran</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {(["", ...MODE_KEHADIRAN] as const).map((mode) => (
            <label
              key={mode || "none"}
              className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-line px-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="radio"
                name={`${idPrefix}-keterangan_kehadiran`}
                value={mode}
                checked={value.keterangan_kehadiran === mode}
                onChange={() => set("keterangan_kehadiran")(mode)}
                className="accent-primary"
              />
              {mode ? MODE_KEHADIRAN_LABEL[mode] : "Belum diisi"}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function CreateUserDialog({ open, onClose, finish }: { open: boolean; onClose: () => void; finish: FinishFn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(DEFAULT_ROLE);
  const [profile, setProfile] = useState<ProfileDraft>(EMPTY_DRAFT);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setEmail("");
    setPassword("");
    setRole(DEFAULT_ROLE);
    setProfile(EMPTY_DRAFT);
  };
  const close = () => {
    reset();
    onClose();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createUserAction({ email, password, role }, profileChanges(profile, EMPTY_DRAFT));
      finish(res, close);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className={dialogClassName}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary">Tambah User</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Buat akun baru. Bagikan kata sandi kepada pengguna secara aman; akun langsung aktif tanpa verifikasi email.
              Data profil boleh dikosongkan dan dilengkapi peserta sendiri di halaman Profil.
            </DialogDescription>
          </DialogHeader>
          <SectionTitle>Akun</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
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
                className={fieldInputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Peran</Label>
              <RoleChoice value={role} onChange={setRole} />
            </div>
          </div>
          <PasswordField id="new-user-password" value={password} onChange={setPassword} />
          <SectionTitle>Data Profil</SectionTitle>
          <ProfileFields idPrefix="new-user" value={profile} onChange={setProfile} disabled={isPending} />
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
  const [role, setRole] = useState<UserRole>(user?.role ?? DEFAULT_ROLE);
  const [password, setPassword] = useState("");
  const [initialProfile] = useState(() => profileToDraft(user?.profile));
  const [profile, setProfile] = useState<ProfileDraft>(initialProfile);
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const changes: { email?: string; role?: UserRole; password?: string } = {};
    if (email.trim().toLowerCase() !== user.email) changes.email = email;
    if (role !== user.role) changes.role = role;
    if (password) changes.password = password;
    const profileDiff = profileChanges(profile, initialProfile);
    if (Object.keys(changes).length === 0 && Object.keys(profileDiff).length === 0) {
      toast.info("Tidak ada perubahan.");
      return;
    }
    startTransition(async () => {
      const res = await updateUserAction(user.id, changes, profileDiff);
      finish(res, onClose);
    });
  };

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={dialogClassName}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary">Edit pengguna</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Ubah akun dan data profil. Kosongkan kata sandi bila tidak ingin mengubahnya; kosongkan field profil untuk menghapus isinya.
            </DialogDescription>
          </DialogHeader>
          <SectionTitle>Akun</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-email" className="text-xs font-semibold text-primary">Email</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={fieldInputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-primary">Peran</Label>
              <RoleChoice value={role} onChange={setRole} disabled={isSelf} />
              {isSelf && <p className="text-[11px] text-ink-muted">Anda tidak dapat mengubah peran akun Anda sendiri.</p>}
            </div>
          </div>
          <PasswordField id="edit-user-password" value={password} onChange={setPassword} optional />
          <SectionTitle>Data Profil</SectionTitle>
          <ProfileFields idPrefix="edit-user" value={profile} onChange={setProfile} disabled={isPending} />
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

function DetailItem({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={cn("space-y-0.5", wide && "sm:col-span-2")}>
      <dt className="text-[11px] font-semibold text-ink-muted">{label}</dt>
      <dd className="text-sm break-words text-ink">{children}</dd>
    </div>
  );
}

const EMPTY_VALUE = <span className="text-ink-muted">—</span>;

function ProfileDetailDialog({
  user,
  onClose,
  onEdit,
}: {
  user: UserRow | null;
  onClose: () => void;
  onEdit: (user: UserRow) => void;
}) {
  const p = user?.profile;
  const show = (v: string | null | undefined) => (v ? v : EMPTY_VALUE);
  const wa = whatsappLink(p?.no_whatsapp);
  const complete = isProfileComplete(p);
  const modeLabel = (v: string | null | undefined) =>
    v ? (MODE_KEHADIRAN_LABEL[v as (typeof MODE_KEHADIRAN)[number]] ?? v) : EMPTY_VALUE;

  return (
    <Dialog open={Boolean(user)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={dialogClassName}>
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-primary">Detail Profil</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="break-all">{user?.email}</span>
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                complete ? "border-brand-green/30 bg-secondary text-brand-green-deep" : "border-brand-gold/40 bg-gold-100 text-brand-gold-text"
              )}
            >
              {complete ? "Profil lengkap" : "Profil belum lengkap"}
            </span>
          </DialogDescription>
        </DialogHeader>
        {user && p && (
          <div className="space-y-5">
            <section className="space-y-3">
              <SectionTitle>Akun</SectionTitle>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Email">{user.email}</DetailItem>
                <DetailItem label="Peran">{ROLE_LABEL[user.role]}</DetailItem>
                <DetailItem label="Status">{user.banned ? "Nonaktif" : "Aktif"}</DetailItem>
                <DetailItem label="Terakhir masuk">{formatUserDate(user.lastSignInAt)}</DetailItem>
                <DetailItem label="Dibuat">{formatUserDate(user.createdAt)}</DetailItem>
                <DetailItem label="Profil diperbarui">{p.updated_at ? formatUserDate(p.updated_at) : EMPTY_VALUE}</DetailItem>
              </dl>
            </section>
            <section className="space-y-3">
              <SectionTitle>Data Profil</SectionTitle>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Nama lengkap" wide>{show(p.nama)}</DetailItem>
                <DetailItem label="Perwakilan Daerah">{show(p.perwakilan_daerah)}</DetailItem>
                <DetailItem label="Jabatan">{show(p.jabatan)}</DetailItem>
                <DetailItem label="Kategori">{show(p.kategori)}</DetailItem>
                <DetailItem label="Ukuran Baju">{show(p.ukuran_baju)}</DetailItem>
                <DetailItem label="No WhatsApp">
                  {p.no_whatsapp && wa ? (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                      {p.no_whatsapp}
                    </a>
                  ) : (
                    EMPTY_VALUE
                  )}
                </DetailItem>
                <DetailItem label="Rencana Kedatangan">{formatArrival(p.rencana_kedatangan) ?? EMPTY_VALUE}</DetailItem>
                <DetailItem label="Keterangan Kehadiran">{modeLabel(p.keterangan_kehadiran)}</DetailItem>
              </dl>
            </section>
            <section className="space-y-3">
              <SectionTitle>Teknis</SectionTitle>
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="ID pengguna"><span className="font-mono text-xs break-all">{user.id}</span></DetailItem>
                <DetailItem label="ID tamu lama">
                  {p.legacy_guest_id ? <span className="font-mono text-xs break-all">{p.legacy_guest_id}</span> : EMPTY_VALUE}
                </DetailItem>
              </dl>
            </section>
          </div>
        )}
        <DialogFooter className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose}>Tutup</Button>
          {user && (
            <Button
              type="button"
              className="h-11 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-green-night"
              onClick={() => onEdit(user)}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportUsersDialog({ open, onClose, onImported }: { open: boolean; onClose: () => void; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportUsersResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const close = () => {
    if (isPending) return;
    setFile(null);
    setResult(null);
    onClose();
  };

  const downloadTemplate = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadFromEndpoint(IMPORT_TEMPLATE_ENDPOINT, "template-import-user-bmh.xlsx");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh template.");
    } finally {
      setDownloading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    const data = new FormData();
    data.set("file", file);
    startTransition(async () => {
      const res = await importUsersAction(data);
      if (!res.success) {
        toast.error(res.error ?? "Gagal mengimpor.");
        return;
      }
      setResult(res);
      if (res.created > 0) {
        toast.success(`${res.created} user berhasil diimpor.`);
        onImported();
      }
      if (res.failed.length > 0) toast.error(`${res.failed.length} baris gagal diimpor.`);
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className={dialogClassName}>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg font-bold text-primary">Import User dari Excel</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              Unduh template, isi satu user per baris (Email dan Password wajib), lalu unggah file .xlsx. Baris yang gagal
              tidak membatalkan baris lain.
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            disabled={downloading}
            className="h-11 gap-2 rounded-xl border-line bg-white px-4 text-sm font-semibold text-primary hover:bg-secondary"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
            Unduh Template
          </Button>
          <div className="space-y-1.5">
            <Label htmlFor="import-user-file" className="text-xs font-semibold text-primary">File Excel (.xlsx)</Label>
            <Input
              id="import-user-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              disabled={isPending}
              className={fieldInputClassName}
            />
          </div>
          {result && (
            <div className="space-y-2 rounded-2xl border border-line p-3 text-xs" aria-live="polite">
              <p className="font-semibold text-primary">
                {result.created} berhasil, {result.failed.length} gagal.
              </p>
              {result.failed.length > 0 && (
                <div className="max-h-60 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Baris</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Alasan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.failed.map((f) => (
                        <TableRow key={f.row}>
                          <TableCell className="tabular-nums">{f.row}</TableCell>
                          <TableCell className="break-all">{f.email || "-"}</TableCell>
                          <TableCell className="whitespace-normal text-danger">{f.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={close} disabled={isPending}>Tutup</Button>
            <Button type="submit" className="h-11 gap-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-green-night" disabled={!file || isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Import
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
