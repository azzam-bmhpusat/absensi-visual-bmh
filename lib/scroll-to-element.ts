import type Lenis from "lenis";

interface ScrollToElementOptions {
  lenis: Lenis | undefined;
  getElement: () => HTMLElement | null;
  /** Jarak elemen dari tepi atas viewport yang diharapkan (px), mis. tinggi navbar + margin. */
  offset: number;
  /** Toleransi dari posisi tujuan sebelum scroll dianggap selesai (px). */
  tolerance?: number;
  /** Dievaluasi di tiap percobaan; bila false untuk beberapa kali berturut-turut, berhenti. */
  enabled?: () => boolean;
  /** Dipanggil sekali saat elemen sudah berada di posisi tujuan. */
  onReach?: (element: HTMLElement) => void;
}

const FIRST_DELAY_MS = 250;
const RETRY_DELAY_MS = 700;
const MAX_TRIES = 15;
const MAX_DISABLED_CHECKS = 3;
const TOLERANCE_PX = 48;

/**
 * Menggulir ke sebuah elemen setelah berpindah halaman (soft navigation) atau memuat URL ber-hash.
 * Lenis (smooth scroll) bertahan antar halaman dan menahan scroll native, sedangkan konten
 * halaman tujuan baru muncul beberapa saat setelah navigasi. Karena itu percobaan diulang
 * sampai elemen benar-benar berada di posisi tujuan, dan dibatalkan jika pengguna mulai
 * menggulir sendiri. Mengembalikan fungsi pembatal untuk cleanup efek.
 */
export function scrollToElementWhenReady({
  lenis,
  getElement,
  offset,
  tolerance = TOLERANCE_PX,
  enabled,
  onReach,
}: ScrollToElementOptions): () => void {
  let tries = 0;
  let disabledChecks = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancelled = false;

  const atPageEnd = () =>
    Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2;

  const cancel = () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  };

  const step = () => {
    if (cancelled) return;

    if (enabled && !enabled()) {
      // Pada soft navigation, URL ber-hash bisa baru diperbarui sesaat setelah komponen mount
      if (++disabledChecks >= MAX_DISABLED_CHECKS) return cancel();
      timer = setTimeout(step, RETRY_DELAY_MS);
      return;
    }

    const element = getElement();
    if (element) {
      const top = element.getBoundingClientRect().top;
      const reached =
        Math.abs(top - offset) <= tolerance || (atPageEnd() && top < window.innerHeight);
      if (reached) {
        onReach?.(element);
        return cancel();
      }
      if (lenis) {
        // Batas scroll Lenis bisa masih memakai tinggi halaman sebelumnya
        lenis.resize();
        lenis.scrollTo(element, { duration: 1 });
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    if (++tries < MAX_TRIES) timer = setTimeout(step, RETRY_DELAY_MS);
    else cancel();
  };

  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  timer = setTimeout(step, FIRST_DELAY_MS);

  return cancel;
}
