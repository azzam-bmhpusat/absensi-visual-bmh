import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { QrCode } from "lucide-react";

export default function AdminPage() {
  return (
    <main className="page-bg min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-primary">
              Panel Pengelolaan Kehadiran
            </h1>
            <p className="text-sm text-ink-muted">
              Monitoring, rekap kehadiran, dan administrasi daftar tamu
            </p>
          </div>
          <Link
            href="/admin/qr"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-secondary text-primary border border-line hover:border-brand-green transition-all"
          >
            <QrCode className="w-4 h-4 text-brand-gold-text" />
            Cetak QR Absen
          </Link>
        </div>

        <Tabs defaultValue="tamu" className="space-y-4">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="tamu" className="rounded-lg">
              Daftar Tamu
            </TabsTrigger>
            <TabsTrigger value="rekap" className="rounded-lg">
              Rekap Kehadiran
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tamu">
            <Card className="rounded-2xl border-line">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-primary">
                  Data Tamu Undangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Fitur import CSV tamu undangan akan diimplementasikan pada Fase 4.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rekap">
            <Card className="rounded-2xl border-line">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-primary">
                  Rekap Kehadiran Acara
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ink-muted">
                  Tabel absensi per sesi dan tombol ekspor CSV (WIB) akan diimplementasikan pada Fase 4.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
