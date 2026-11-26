import Image from "next/image";
import { DRESSCODE_DATA } from "@/content/rakernas";
import { RevealItem, RevealStagger } from "@/components/motion/reveal";

/** Dress code per hari: kartu foto berjajar (desktop) / bertumpuk (HP). */
export function DresscodeSection() {
  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-5 md:px-8 lg:gap-10">
      <div className="flex flex-col items-start gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="flex flex-col gap-2 lg:gap-3">
          <p className="text-[11px] font-bold tracking-[1.4px] text-[#1E7F62] uppercase lg:text-xs lg:tracking-[1.6px]">
            Busana Peserta
          </p>
          <h2 className="font-heading text-[30px] font-bold text-primary lg:text-[40px]">Dress Code</h2>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-[#FFF7E8] px-3.5 py-2 text-xs font-semibold text-[#9A6A12] lg:px-4 lg:py-2.5 lg:text-[13px]">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#9A6A12]" />
          Songkok Nasional di setiap sesi
        </p>
      </div>

      <RevealStagger className="grid gap-[22px] md:grid-cols-3 md:gap-6" stagger={0.1}>
        {DRESSCODE_DATA.map((item, index) => (
          <RevealItem key={item.src} y={16}>
            <article className="group flex flex-col gap-3.5 lg:gap-4">
              <div className="relative h-[360px] overflow-hidden rounded-[20px] bg-muted/30 md:h-[380px] lg:h-[460px] lg:rounded-3xl">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 flex h-[110px] flex-col justify-end gap-0.5 bg-linear-to-b from-[#04362F00] from-20% to-[#04362F99] px-5 pb-[18px] lg:h-[120px] lg:px-6 lg:pb-[22px]">
                  <span className="text-[11px] font-bold tracking-[1.4px] text-brand-gold lg:text-xs lg:tracking-[1.6px]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-xl font-semibold text-white lg:text-[22px]">{item.day}</h3>
                </div>
              </div>
              <p className="text-sm/[22px] text-[#4F7A72] lg:text-[15px]/[23px]">{item.desc}</p>
            </article>
          </RevealItem>
        ))}
      </RevealStagger>
    </div>
  );
}
