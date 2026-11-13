import { AttendanceBoard } from "@/components/display/attendance-board";
import { Progress } from "@/components/ui/progress";

export default function DisplayPage() {
  const eventName = process.env.NEXT_PUBLIC_EVENT_NAME || "Silaturahim & Rapat Koordinasi Nasional BMH";

  return (
    <main className="display-theme w-screen h-screen overflow-hidden bg-background text-foreground p-12 flex flex-col justify-between">
      {/* Header */}
      <header className="flex items-center justify-between h-24 border-b border-border/40 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-gold-soft">
            Layar Kehadiran Realtime
          </span>
          <h1 className="text-4xl font-heading font-bold text-white tracking-tight">
            {eventName}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-heading font-semibold text-brand-gold-soft">
            Hari Pertama
          </div>
          <div className="text-sm text-muted-foreground">WIB (Asia/Jakarta)</div>
        </div>
      </header>

      {/* Counter & Progress */}
      <section className="py-6 space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
              Hadir
            </span>
            <span className="text-7xl font-heading font-bold text-brand-gold-soft">2</span>
            <span className="text-3xl text-muted-foreground font-semibold">/ 3</span>
          </div>
          <div className="text-2xl font-bold text-brand-green">67%</div>
        </div>
        <Progress value={67} className="h-4 bg-secondary [&>div]:bg-brand-green" />
      </section>

      {/* Board */}
      <AttendanceBoard />

      {/* Footer */}
      <footer className="h-12 flex items-center justify-between text-sm text-muted-foreground border-t border-border/40 pt-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse" />
          <span>Terhubung ke sistem</span>
        </div>
        <div>Scan QR di lokasi untuk mencatat kehadiran</div>
      </footer>
    </main>
  );
}
