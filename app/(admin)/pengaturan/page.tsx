import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { readEventSettings } from "@/lib/event-settings-server";
import { EventSettingsForm } from "@/components/admin/event-settings-form";

export const instant = false;

export default async function PengaturanPage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { settings, error } = await readEventSettings();
  // A refreshed server read must replace an old draft, including recovery from a failed read.
  return <EventSettingsForm key={`${error ?? "loaded"}:${JSON.stringify(settings)}`} initialSettings={settings} loadError={error} />;
}
