// Rate limiter in-memory sederhana untuk 10 submit/menit/IP
const hits = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const record = hits.get(ip);

  if (!record || now > record.expiresAt) {
    hits.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}
