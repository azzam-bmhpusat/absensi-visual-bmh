"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, ExternalLink, Link2, LoaderCircle, MapPin, Save } from "lucide-react";
import { toast } from "sonner";
import { saveEventSettings } from "@/app/(admin)/pengaturan/actions";
import { addCalendarDays, type EventSettings } from "@/lib/event-settings";
import { eventSettingsFormSchema, toEventSettingsForm, type EventSettingsFieldErrors, type EventSettingsFormValues } from "@/lib/event-settings-validation";
import { FOOTER_DATA } from "@/content/rakernas";
import { LocationMap } from "@/components/rakernas/location-map";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface Props { initialSettings: EventSettings; loadError?: string | null }

export function EventSettingsForm({ initialSettings, loadError }: Props) {
  const [values, setValues] = useState(() => toEventSettingsForm(initialSettings));
  const [errors, setErrors] = useState<EventSettingsFieldErrors>({});
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const endDate = addCalendarDays(values.startsAtLocal.slice(0, 10), 2);
  const latitude = Number(values.latitude);
  const longitude = Number(values.longitude);
  const validCoordinates = values.latitude.trim() !== "" && values.longitude.trim() !== "" &&
    Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  const location = {
    venueName: values.venueName || initialSettings.venueName,
    venueAddress: values.venueAddress,
    mapsUrl: /^https:\/\//i.test(values.mapsUrl) ? values.mapsUrl : initialSettings.mapsUrl,
    latitude: validCoordinates ? latitude : initialSettings.latitude,
    longitude: validCoordinates ? longitude : initialSettings.longitude,
  };

  function change(field: keyof EventSettingsFormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setFeedback(null);
  }

  function fieldProps(field: keyof EventSettingsFormValues) {
    return {
      id: field, name: field, value: values[field],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(field, event.target.value),
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errors[field] ? `${field}-error` : undefined,
      className: "h-11 w-full min-w-0 text-base md:text-sm",
    };
  }

  function fieldError(field: keyof EventSettingsFormValues) {
    return errors[field] ? <p id={`${field}-error`} className="text-sm text-destructive">{errors[field]}</p> : null;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || loadError) return;
    const parsed = eventSettingsFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: EventSettingsFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EventSettingsFormValues;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setFeedback({ success: false, text: "Periksa kembali kolom yang ditandai." });
      document.getElementById(Object.keys(nextErrors)[0])?.focus();
      return;
    }
    setErrors({});
    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await saveEventSettings(values);
        if (!result.success) {
          setErrors(result.fieldErrors ?? {});
          setFeedback({ success: false, text: result.error });
          toast.error(result.error);
          return;
        }
        setValues(toEventSettingsForm(result.settings));
        const text = "Pengaturan berhasil disimpan. Muat ulang beranda untuk melihat perubahan.";
        setFeedback({ success: true, text });
        toast.success(text);
        router.refresh();
      } catch {
        const text = "Pengaturan gagal disimpan. Periksa koneksi lalu coba lagi.";
        setFeedback({ success: false, text });
        toast.error(text);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto w-full max-w-5xl space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary">Beranda</Badge>
        <h1 className="font-heading text-2xl font-semibold text-primary md:text-3xl">Pengaturan Acara</h1>
        <p className="text-sm text-muted-foreground">Atur lokasi, tautan penyelenggara, dan jadwal yang ditampilkan di beranda.</p>
      </div>
      {loadError && (
        <Card className="border-destructive/40">
          <CardContent className="space-y-3 pt-6">
            <p role="alert" className="text-sm text-destructive">{loadError}</p>
            <Button type="button" variant="outline" className="min-h-11" onClick={() => router.refresh()}>Muat ulang pengaturan</Button>
          </CardContent>
        </Card>
      )}
      <fieldset disabled={isPending || Boolean(loadError)} className="min-w-0 space-y-6 disabled:opacity-70">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="size-5 text-primary" />Lokasi acara</CardTitle>
            <CardDescription>Tentukan tempat dan titik peta. Alamat diisi secara manual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="venueName">Nama tempat</Label><Input {...fieldProps("venueName")} maxLength={200} autoComplete="organization" />{fieldError("venueName")}</div>
            <div className="space-y-2"><Label htmlFor="venueAddress">Alamat</Label><Textarea {...fieldProps("venueAddress")} className="min-h-24 w-full text-base md:text-sm" maxLength={1000} autoComplete="street-address" />{fieldError("venueAddress")}</div>
            <div className="space-y-2"><Label htmlFor="mapsUrl">Tautan Google Maps</Label><Input {...fieldProps("mapsUrl")} type="url" placeholder="https://maps.google.com/…" />{fieldError("mapsUrl")}</div>
            <Separator />
            <div className="space-y-3">
              <p id="map-help" className="text-sm text-muted-foreground">Klik peta atau geser pin untuk memilih titik. Koordinat juga dapat diisi melalui kolom di bawah.</p>
              <div aria-describedby="map-help" className={isPending || loadError ? "pointer-events-none" : undefined}>
                <LocationMap location={location} editable onLocationChange={(lat, lng) => {
                  if (isPending || loadError) return;
                  setValues((previous) => ({ ...previous, latitude: String(lat), longitude: String(lng) }));
                  setErrors((previous) => ({ ...previous, latitude: undefined, longitude: undefined }));
                  setFeedback(null);
                }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="latitude">Lintang</Label><Input {...fieldProps("latitude")} type="number" inputMode="decimal" step="any" min={-90} max={90} />{fieldError("latitude")}</div>
                <div className="space-y-2"><Label htmlFor="longitude">Bujur</Label><Input {...fieldProps("longitude")} type="number" inputMode="decimal" step="any" min={-180} max={180} />{fieldError("longitude")}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="size-5 text-primary" />Tautan footer</CardTitle><CardDescription>Tautan pada teks penyelenggara “{FOOTER_DATA.committee.label}”.</CardDescription></CardHeader>
          <CardContent className="space-y-2"><Label htmlFor="footerUrl">URL penyelenggara</Label><Input {...fieldProps("footerUrl")} type="url" placeholder="https://…" />{fieldError("footerUrl")}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-primary" />Jadwal acara</CardTitle><CardDescription>Semua tanggal dan jam menggunakan WIB (UTC+7). Acara berlangsung selama tiga hari.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2"><Label htmlFor="startsAtLocal">Tanggal dan jam mulai (WIB)</Label><Input {...fieldProps("startsAtLocal")} type="datetime-local" />{fieldError("startsAtLocal")}</div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="endDate">Tanggal selesai (otomatis)</Label><Input id="endDate" type="date" value={endDate} readOnly className="h-11 w-full min-w-0 bg-muted text-base md:text-sm" /><p className="text-xs text-muted-foreground">Dua hari setelah tanggal mulai.</p></div>
              <div className="space-y-2"><Label htmlFor="endTime">Jam selesai (WIB, opsional)</Label><Input {...fieldProps("endTime")} type="time" />{fieldError("endTime")}<p className="text-xs text-muted-foreground">Kosongkan jika jam selesai belum ditentukan.</p></div>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">Tanggal sesi absensi tetap diatur melalui Kelola Sesi Acara. Judul acara dan tema tetap mengikuti konten beranda.</p>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" className="min-h-11 w-full sm:w-auto" disabled={isPending || Boolean(loadError)}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
            {isPending ? "Menyimpan…" : "Simpan Pengaturan"}
          </Button>
          <Button variant="outline" className="min-h-11 w-full sm:w-auto" nativeButton={false} render={<a href="/" target="_blank" rel="noopener noreferrer" />}><ExternalLink className="size-4" />Lihat beranda</Button>
        </div>
      </fieldset>
      <div aria-live="polite" aria-atomic="true">{feedback && <p className={`text-sm ${feedback.success ? "text-primary" : "text-destructive"}`} role={feedback.success ? "status" : "alert"}>{feedback.text}</p>}</div>
    </form>
  );
}
