export function normalizeString(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

export function normalizeCompare(str: string): string {
  return normalizeString(str).toLowerCase();
}
