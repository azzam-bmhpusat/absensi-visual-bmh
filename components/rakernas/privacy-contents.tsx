"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { PRIVACY_SECTIONS, type PrivacySectionId } from "@/lib/privacy-policy";

export function PrivacyContents() {
  const [activeId, setActiveId] = useState<PrivacySectionId>(PRIVACY_SECTIONS[0].id);

  useEffect(() => {
    const sections = PRIVACY_SECTIONS.map(({ id }) => ({
      id,
      element: document.getElementById(id),
    }));
    let frame: number | null = null;
    const updateActive = () => {
      frame = null;
      let current: PrivacySectionId = PRIVACY_SECTIONS[0].id;
      const marker = (document.querySelector("header.sticky")?.getBoundingClientRect().bottom ?? 72) + 32;
      for (const { id, element } of sections) {
        if (element && element.getBoundingClientRect().top <= marker) current = id;
      }
      setActiveId(current);
    };
    const scheduleUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateActive);
    };
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <nav aria-label="Daftar isi kebijakan privasi" className="min-w-0 lg:rounded-[18px] lg:border lg:border-line lg:bg-white lg:p-2">
      <p className="hidden px-1 pb-2 text-[11px] font-bold text-ink-muted lg:block">DAFTAR ISI</p>
      <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {PRIVACY_SECTIONS.map(({ id, number, title }) => (
          <li key={id} className="shrink-0 lg:shrink">
            <a
              href={`#${id}`}
              aria-current={activeId === id ? "location" : undefined}
              onClick={() => setActiveId(id)}
              className={cn(
                "flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-[13px]/5 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:min-h-0 lg:gap-2.5 lg:rounded-[10px] lg:border-0 lg:py-2.5 lg:whitespace-normal",
                activeId === id
                  ? "border-primary bg-primary font-semibold text-white lg:bg-secondary lg:text-primary"
                  : "border-line bg-white text-ink hover:bg-secondary",
              )}
            >
              <span className="shrink-0 text-xs font-semibold text-current">{number}</span>
              <span>{title}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
