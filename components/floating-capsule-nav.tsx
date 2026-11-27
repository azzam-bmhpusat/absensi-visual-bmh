import type { ReactNode } from "react";

export function FloatingCapsuleNav({ brand, children, actions }: {
  brand: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-50 -mb-[calc(72px+env(safe-area-inset-top))] box-content h-[72px] px-4 pt-[env(safe-area-inset-top)] min-[760px]:px-6">
      <div className="relative top-2 mx-auto flex h-[52px] max-w-[1200px] items-center justify-between rounded-full border border-white/75 bg-white/80 bg-linear-to-b from-white/50 to-60% to-transparent pr-2 pl-3.5 shadow-[0_10px_30px_#04362F24,0_2px_6px_#04362F12,inset_0_1px_0_#FFFFFFE6] backdrop-blur-[24px] backdrop-saturate-150 min-[760px]:max-lg:top-1.5 min-[760px]:pl-5 lg:grid lg:h-14 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:justify-items-start">
        {brand}
        <div className="hidden lg:block">{children}</div>
        <div className="flex shrink-0 items-center justify-self-end">{actions}</div>
      </div>
    </header>
  );
}
