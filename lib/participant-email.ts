/** Domain email untuk akun peserta. */
export const PARTICIPANT_EMAIL_DOMAIN = "bmh.or.id";

/** Singkatan nama yang dilewati saat mencari "nama depan" (dibandingkan tanpa titik, huruf kecil). */
const SKIPPED_ABBREVIATIONS = new Set(["m", "muh"]);

/**
 * Nama depan untuk email: gelar setelah koma dibuang ("Mahfud Arobi, S.E." → "Mahfud"),
 * singkatan ("M", "Muh", "Muh.") dilewati, lalu hanya huruf/angka kecil yang dipakai.
 */
export function participantFirstName(fullName: string): string {
  const withoutTitles = fullName.split(",")[0] ?? "";
  const tokens = withoutTitles.trim().split(/\s+/).filter(Boolean);
  const chosen =
    tokens.find((t) => !SKIPPED_ABBREVIATIONS.has(t.toLowerCase().replace(/\.+$/, ""))) ?? tokens[0] ?? "";
  return chosen
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Email unik untuk satu peserta. Bila alamat dasar (mis. abdul@bmh.or.id) sudah dipakai,
 * ditambah nomor berurutan: abdul2@, abdul3@, ... `taken` berisi email yang sudah ada (huruf kecil).
 */
export function nextParticipantEmail(fullName: string, taken: ReadonlySet<string>): string {
  const base = participantFirstName(fullName) || "peserta";
  let candidate = `${base}@${PARTICIPANT_EMAIL_DOMAIN}`;
  for (let n = 2; taken.has(candidate); n += 1) {
    candidate = `${base}${n}@${PARTICIPANT_EMAIL_DOMAIN}`;
  }
  return candidate;
}

/** Email untuk daftar nama secara berurutan (urutan menentukan siapa yang mendapat nomor). */
export function buildParticipantEmails(names: readonly string[], existing: Iterable<string> = []): string[] {
  const taken = new Set<string>([...existing].map((e) => e.toLowerCase()));
  return names.map((name) => {
    const email = nextParticipantEmail(name, taken);
    taken.add(email);
    return email;
  });
}
