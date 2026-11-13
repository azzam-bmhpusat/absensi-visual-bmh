import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  return (
    <main className="page-bg min-h-screen flex items-center justify-center p-5">
      <Card className="w-full max-w-sm rounded-2xl shadow-sm border-line">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="font-heading text-xl text-primary font-bold">
            Login Panitia BMH
          </CardTitle>
          <p className="text-xs text-ink-muted">
            Masuk untuk mengelola data kehadiran acara
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@bmh.or.id" className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Kata Sandi</Label>
            <Input id="password" type="password" className="h-11 rounded-xl" />
          </div>
          <Button className="w-full h-11 rounded-xl bg-primary hover:bg-brand-green-deep text-white font-medium">
            Masuk
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
