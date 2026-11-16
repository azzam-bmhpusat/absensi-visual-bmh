import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
import { eventSettingsToRow, toEventSettingsForm } from "@/lib/event-settings-validation";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn(), update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn(), updateTag: vi.fn(), revalidatePath: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser }, from: mocks.from }) }));
vi.mock("next/cache", () => ({ updateTag: mocks.updateTag, revalidatePath: mocks.revalidatePath }));
import { saveEventSettings } from "@/app/(admin)/pengaturan/actions";

describe("saveEventSettings authorization and persistence", () => {
  const values = toEventSettingsForm(DEFAULT_EVENT_SETTINGS);
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    mocks.from.mockReturnValue({ update: mocks.update });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.eq.mockReturnValue({ select: mocks.select });
    mocks.select.mockReturnValue({ single: mocks.single });
    mocks.single.mockResolvedValue({ data: { id: 1 }, error: null });
  });

  it("denies anonymous requests before accessing the table", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(await saveEventSettings(values)).toMatchObject({ success: false, error: expect.stringContaining("admin") });
    expect(mocks.from).not.toHaveBeenCalled();
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("denies expired credentials even if a user value is returned", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: new Error("expired") });
    expect((await saveEventSettings(values)).success).toBe(false);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it("validates untrusted input on the server and returns field errors", async () => {
    expect(await saveEventSettings({ ...values, latitude: "91", footerUrl: "javascript:alert(1)" })).toMatchObject({ success: false, fieldErrors: { latitude: expect.any(String), footerUrl: expect.any(String) } });
    expect(mocks.update).not.toHaveBeenCalled();
    expect((await saveEventSettings(null)).success).toBe(false);
  });

  it("updates exactly the seeded singleton and expires shared/homepage caches after success", async () => {
    const result = await saveEventSettings({ ...values, venueName: "Gedung Baru", startsAtLocal: "2026-12-31T10:00", endTime: "15:00" });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.settings.endsAt).toBe("2027-01-02T08:00:00.000Z");
    expect(mocks.from).toHaveBeenCalledWith("event_settings");
    expect(mocks.update).toHaveBeenCalledWith(eventSettingsToRow(result.settings));
    expect(mocks.eq).toHaveBeenCalledWith("id", 1);
    expect(mocks.updateTag).toHaveBeenCalledWith("event-settings");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/pengaturan");
  });

  it.each([
    { data: null, error: { code: "42P01", message: "table missing" } },
    { data: null, error: { message: "RLS denied" } },
    { data: null, error: null },
  ])("never reports success for database errors or a missing singleton", async (response) => {
    mocks.single.mockResolvedValue(response);
    expect((await saveEventSettings(values)).success).toBe(false);
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });

  it("handles a network rejection without exposing internal errors", async () => {
    mocks.single.mockRejectedValue(new Error("secret connection details"));
    const result = await saveEventSettings(values);
    expect(result).toMatchObject({ success: false });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});
