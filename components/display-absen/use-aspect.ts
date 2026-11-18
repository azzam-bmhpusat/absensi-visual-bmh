"use client";

import { useEffect, useState } from "react";
import { bucketAspect } from "@/lib/display-absen-model";

/** Rasio lebar:tinggi jendela (dibulatkan 0.05) agar adegan selalu memenuhi layar tanpa potongan. */
export function useAspect(): number {
  const [aspect, setAspect] = useState(16 / 9);
  useEffect(() => {
    const read = () => setAspect(bucketAspect(window.innerWidth / Math.max(1, window.innerHeight)));
    const first = setTimeout(read, 0);
    window.addEventListener("resize", read);
    return () => {
      clearTimeout(first);
      window.removeEventListener("resize", read);
    };
  }, []);
  return aspect;
}
