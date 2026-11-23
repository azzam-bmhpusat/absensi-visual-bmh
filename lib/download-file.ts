function filenameFromDisposition(header: string | null): string | null {
  const match = header?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? null;
}

/** Unduh file dari endpoint ekspor; melempar Error berisi pesan dari server bila gagal. */
export async function downloadFromEndpoint(url: string, fallbackName: string): Promise<void> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || `Gagal mengekspor (HTTP ${res.status}).`);
  }
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filenameFromDisposition(res.headers.get("Content-Disposition")) ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
