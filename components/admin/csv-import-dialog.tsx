"use client";

import { useState, useTransition, useId } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  parseAndValidateGuestCsv,
  type ParsedCsvResult,
  type ExistingGuestLookup,
} from "@/lib/csv";
import { importGuestsAction } from "@/app/admin/actions";
import { toast } from "sonner";

interface CsvImportDialogProps {
  existingGuests: ExistingGuestLookup[];
  onImportSuccess?: () => void;
}

export function CsvImportDialog({
  existingGuests,
  onImportSuccess,
}: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedCsvResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, startImportTransition] = useTransition();
  const fileInputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Format file harus berupa CSV (.csv)");
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const result = parseAndValidateGuestCsv(text, existingGuests);
        setParsedResult(result);
      } catch (err) {
        console.error("Gagal parse CSV:", err);
        toast.error("Gagal membaca struktur file CSV");
      } finally {
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      toast.error("Gagal membuka file");
      setIsParsing(false);
    };

    reader.readAsText(selectedFile, "UTF-8");
  };

  const handleReset = () => {
    setFile(null);
    setParsedResult(null);
  };

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.validRows.length === 0) return;

    startImportTransition(async () => {
      const res = await importGuestsAction(parsedResult.validRows);
      if (res.success) {
        toast.success(
          `Berhasil mengimpor ${parsedResult.validRows.length} data tamu undangan!`
        );
        handleReset();
        setOpen(false);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } else {
        toast.error(res.error || "Gagal mengimpor data tamu.");
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="h-10 px-4 rounded-xl bg-primary hover:bg-brand-green-deep text-white font-medium shadow-xs"
      >
        <Upload className="w-4 h-4 mr-2 text-brand-gold-soft" />
        Import CSV Tamu
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-6 rounded-3xl">
        <DialogHeader className="pb-3 border-b border-line">
          <DialogTitle className="font-heading text-xl text-primary font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-brand-green" />
            Import Daftar Tamu Undangan
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-muted">
            Unggah file CSV dengan kolom header <strong>nama</strong> dan{" "}
            <strong>perwakilan_daerah</strong>. Duplikat akan dilewati otomatis.
          </DialogDescription>
        </DialogHeader>

        {!file && (
          <div className="py-8 flex flex-col items-center justify-center border-2 border-dashed border-line hover:border-brand-green rounded-2xl p-6 text-center transition-colors bg-surface/50">
            <FileSpreadsheet className="w-12 h-12 text-ink-muted/50 mb-3" />
            <p className="text-sm font-semibold text-primary mb-1">
              Pilih file CSV dari komputer Anda
            </p>
            <p className="text-xs text-ink-muted mb-4 max-w-sm">
              Pastikan baris pertama berisi header{" "}
              <code className="px-1.5 py-0.5 bg-muted rounded text-primary">
                nama,perwakilan_daerah
              </code>
            </p>

            <label
              htmlFor={fileInputId}
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-brand-green-deep text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Upload className="w-4 h-4" />
              Pilih File CSV
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        )}

        {isParsing && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-green" />
            <p className="text-xs font-medium text-ink-muted">
              Menganalisis baris file CSV...
            </p>
          </div>
        )}

        {parsedResult && !isParsing && (
          <div className="space-y-4 py-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 bg-secondary rounded-xl text-xs">
              <span className="font-medium text-primary truncate max-w-xs">
                File: {file?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs text-ink-muted hover:text-danger hover:bg-red-50"
              >
                Ganti File
              </Button>
            </div>

            {/* Ringkasan status */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-line bg-white flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-brand-green shrink-0" />
                <div>
                  <div className="text-lg font-bold text-primary">
                    {parsedResult.validRows.length}
                  </div>
                  <div className="text-[11px] text-ink-muted">Siap Diimpor</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-line bg-white flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                <div>
                  <div className="text-lg font-bold text-primary">
                    {parsedResult.duplicatesCount}
                  </div>
                  <div className="text-[11px] text-ink-muted">Duplikat Dilewati</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-line bg-white flex items-center gap-2.5">
                <XCircle className="w-5 h-5 text-danger shrink-0" />
                <div>
                  <div className="text-lg font-bold text-primary">
                    {parsedResult.invalidRows.length}
                  </div>
                  <div className="text-[11px] text-ink-muted">Tidak Valid</div>
                </div>
              </div>
            </div>

            {/* Tab/Scroll pratinjau */}
            <div className="flex-1 overflow-hidden flex flex-col border border-line rounded-xl">
              <div className="bg-muted px-4 py-2 text-xs font-semibold text-primary border-b border-line flex justify-between">
                <span>Pratinjau Tamu Siap Masuk</span>
                <span>{parsedResult.validRows.length} data</span>
              </div>
              <ScrollArea className="h-44 p-3">
                {parsedResult.validRows.length === 0 ? (
                  <p className="text-xs text-ink-muted text-center py-6">
                    Tidak ada baris data baru yang valid untuk diimpor.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {parsedResult.validRows.map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-surface/70"
                      >
                        <span className="font-semibold text-primary">
                          {row.nama}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-white text-[11px] border-line font-normal"
                        >
                          {row.perwakilan_daerah}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Jika ada error atau duplikat, tampilkan info ringkas */}
            {parsedResult.invalidRows.length > 0 && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-danger" />
                  Baris tidak valid diabaikan (contoh alasan: nama / daerah terlalu
                  pendek atau kosong)
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-line flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isImporting}
            className="rounded-xl border-line text-xs"
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={handleConfirmImport}
            disabled={
              !parsedResult ||
              parsedResult.validRows.length === 0 ||
              isImporting
            }
            className="rounded-xl bg-primary hover:bg-brand-green-deep text-white text-xs font-semibold shadow-xs"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                Menyimpan ke Database...
              </>
            ) : (
              `Konfirmasi & Simpan (${parsedResult?.validRows.length ?? 0} Tamu)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  );
}
