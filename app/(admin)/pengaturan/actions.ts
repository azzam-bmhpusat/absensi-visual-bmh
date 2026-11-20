"use server";

import { revalidatePath, updateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { EVENT_SETTINGS_CACHE_TAG, type EventSettings } from "@/lib/event-settings";
import { eventSettingsFormSchema, eventSettingsToRow, type EventSettingsFieldErrors } from "@/lib/event-settings-validation";

export type SaveEventSettingsResult =
  | { success: true; settings: EventSettings }
  | { success: false; error: string; fieldErrors?: EventSettingsFieldErrors };

export async function saveEventSettings(input: unknown): Promise<SaveEventSettingsResult> {
  try {
    const supabase = await createClient();
    const user = await getAdminUser(supabase);
    if (!user) return { success: false, error: "Sesi admin berakhir. Silakan masuk kembali." };

    const parsed = eventSettingsFormSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: EventSettingsFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof EventSettingsFieldErrors;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      return { success: false, error: "Periksa kembali kolom yang ditandai.", fieldErrors };
    }

    // Update only: a missing migration/seed must never look like a successful save.
    const { data, error } = await supabase.from("event_settings")
      .update(eventSettingsToRow(parsed.data)).eq("id", 1).select("id").single();
    if (error || !data) return { success: false, error: "Pengaturan gagal disimpan. Periksa koneksi dan pastikan migrasi pengaturan sudah diterapkan." };

    updateTag(EVENT_SETTINGS_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/pengaturan");
    return { success: true, settings: parsed.data };
  } catch {
    return { success: false, error: "Pengaturan gagal disimpan. Silakan coba lagi." };
  }
}
