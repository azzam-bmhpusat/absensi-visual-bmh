"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CONTENT_KINDS, rowToFormValues, type ContentKind, type FieldConfig } from "@/lib/content/admin-config";
import type { ContentResult, FieldErrors } from "@/lib/content/schema";
import { deleteContent, saveContent } from "@/app/(admin)/kelola-konten/actions";

export type ContentRowData = Record<string, unknown> & { id: number };

/** Tabel + dialog tambah/edit/hapus untuk satu jenis konten (lihat CONTENT_KINDS). */
export function ContentManager({
  kind,
  rows,
  renderActions,
}: {
  kind: ContentKind;
  rows: ContentRowData[];
  /** Aksi tambahan per baris (mis. "Edit penghuni" pada kamar). */
  renderActions?: (row: ContentRowData) => React.ReactNode;
}) {
  const cfg = CONTENT_KINDS[kind];
  const router = useRouter();
  const [editing, setEditing] = useState<ContentRowData | "new" | null>(null);
  const [toDelete, setToDelete] = useState<ContentRowData | null>(null);
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () => {
    if (!toDelete) return;
    startTransition(async () => {
      const res = await deleteContent(kind, toDelete.id);
      if (!res.success) return void toast.error(res.error);
      toast.success(`${cfg.title} dihapus.`);
      setToDelete(null);
      router.refresh();
    });
  };

  const label = (row: ContentRowData) => String(row[cfg.columns[0].name] ?? row.judul ?? row.nomor ?? "");

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-primary">
          {cfg.title} <span className="text-sm font-normal text-ink-muted">({rows.length})</span>
        </h2>
        <Button type="button" className="h-10 gap-2 rounded-xl" onClick={() => setEditing("new")}>
          <Plus className="size-4" aria-hidden="true" />
          Tambah {cfg.singular}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {cfg.columns.map((c) => <TableHead key={c.name}>{c.label}</TableHead>)}
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={cfg.columns.length + 1} className="py-8 text-center text-sm text-ink-muted">
                  Belum ada data.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const values = rowToFormValues(row);
                return (
                  <TableRow key={row.id}>
                    {cfg.columns.map((c) => (
                      <TableCell key={c.name} className="max-w-xs truncate">{values[c.name] || "-"}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {renderActions?.(row)}
                        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-lg" onClick={() => setEditing(row)}>
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-lg text-danger" onClick={() => setToDelete(row)}>
                          <Trash2 className="size-3.5" aria-hidden="true" />
                          Hapus
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

      {editing && (
        <ContentFormDialog
          key={editing === "new" ? "new" : editing.id}
          kind={kind}
          row={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); router.refresh(); }}
        />
      )}

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-heading text-lg font-bold text-danger">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              Hapus {cfg.singular}?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-ink-muted">
              <strong className="text-ink">{toDelete ? label(toDelete) : ""}</strong> akan dihapus permanen dari halaman publik.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={() => setToDelete(null)}>Batal</Button>
            <Button type="button" className="h-11 gap-2 rounded-xl bg-danger text-white hover:bg-danger/90" onClick={confirmDelete} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ContentFormDialog({
  kind, row, onClose, onSaved,
}: { kind: ContentKind; row: ContentRowData | null; onClose: () => void; onSaved: () => void }) {
  const cfg = CONTENT_KINDS[kind];
  const initial = row ? rowToFormValues(row) : {};
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (row) fd.set("id", String(row.id));
    startTransition(async () => {
      const res: ContentResult = await saveContent(kind, fd);
      if (!res.success) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success(row ? "Perubahan disimpan." : `${cfg.title} ditambahkan.`);
      onSaved();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="max-h-[90svh] max-w-lg overflow-y-auto rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-bold text-primary">
            {row ? `Edit ${cfg.singular}` : `Tambah ${cfg.singular}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">Perubahan langsung tampil di halaman publik.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {cfg.fields.map((f) => (
            <Field key={f.name} field={f} defaultValue={initial[f.name] ?? (f.name === "urutan" ? "0" : "")} error={errors[f.name]} isEdit={Boolean(row)} />
          ))}
          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="h-11 rounded-xl" onClick={onClose} disabled={isPending}>Batal</Button>
            <Button type="submit" className="h-11 gap-2 rounded-xl" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Field({ field: f, defaultValue, error, isEdit }: { field: FieldConfig; defaultValue: string; error?: string; isEdit: boolean }) {
  const id = `field-${f.name}`;
  const common = { id, name: f.name, "aria-invalid": Boolean(error) || undefined, "aria-describedby": error || f.hint ? `${id}-desc` : undefined };
  let control: React.ReactNode;
  switch (f.type) {
    case "textarea":
    case "lines":
      control = <Textarea {...common} defaultValue={defaultValue} rows={f.type === "lines" ? 5 : 3} />;
      break;
    case "select":
      control = (
        <select {...common} defaultValue={defaultValue || f.options?.[0]} className={selectClass}>
          {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "image":
      control = <Input {...common} type="file" accept="image/jpeg,image/png,image/webp" className="h-11 rounded-xl" />;
      break;
    default:
      control = (
        <Input
          {...common}
          type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
          inputMode={f.type === "number" ? "numeric" : undefined}
          defaultValue={defaultValue}
          placeholder={f.placeholder}
          className="h-11 rounded-xl"
        />
      );
  }
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {f.label}
        {f.required && !(f.type === "image" && isEdit) && <span className="text-danger"> *</span>}
      </Label>
      {control}
      {(error || f.hint) && (
        <p id={`${id}-desc`} className={error ? "text-xs text-danger" : "text-xs text-ink-muted"}>{error ?? f.hint}</p>
      )}
    </div>
  );
}
