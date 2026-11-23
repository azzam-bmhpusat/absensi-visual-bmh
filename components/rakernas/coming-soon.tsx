import Link from "next/link";
import { ArrowLeft, Clock, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type ComingSoonProps = {
  /** Ikon yang mewakili isi halaman nanti. */
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

/** Penanda halaman yang isinya belum tersedia. */
export function ComingSoon({ icon: Icon, title, description, className }: ComingSoonProps) {
  return (
    <Empty
      className={cn(
        "border border-line bg-white/80 px-6 py-14 shadow-sm md:py-20 dark:bg-card/60",
        className
      )}
    >
      <EmptyHeader className="max-w-md gap-3">
        <EmptyMedia className="relative mb-3">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-green-deep text-white shadow-md ring-8 ring-brand-green/10">
            <Icon className="size-7" aria-hidden />
          </span>
        </EmptyMedia>
        <Badge className="gap-1.5 bg-brand-gold-soft/25 px-2.5 text-brand-green-deep dark:text-brand-gold-soft">
          <Clock aria-hidden />
          Segera Hadir
        </Badge>
        <EmptyTitle className="font-heading text-xl font-semibold text-primary md:text-2xl">
          {title}
        </EmptyTitle>
        <EmptyDescription className="text-sm/relaxed md:text-base/relaxed">
          {description}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-11 rounded-lg px-4 text-sm font-semibold"
          )}
        >
          <ArrowLeft aria-hidden />
          Kembali ke Beranda
        </Link>
      </EmptyContent>
    </Empty>
  );
}
