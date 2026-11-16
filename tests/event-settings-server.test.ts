import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";
import { eventSettingsToRow } from "@/lib/event-settings-validation";

const mocks = vi.hoisted(() => ({ single: vi.fn(), tag: vi.fn(), life: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheTag: mocks.tag, cacheLife: mocks.life }));
vi.mock("@/lib/supabase/server", () => ({ createPublicServerClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }) }) }));
import { getEventSettings, readEventSettings } from "@/lib/event-settings-server";

describe("public settings reader", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("returns stored data with a shared cache tag", async () => {
    mocks.single.mockResolvedValue({ data: eventSettingsToRow({ ...DEFAULT_EVENT_SETTINGS, venueName: "Tempat Baru" }), error: null });
    expect((await getEventSettings()).venueName).toBe("Tempat Baru");
    expect(mocks.tag).toHaveBeenCalledWith("event-settings");
    expect(mocks.life).toHaveBeenCalled();
  });
  it.each([
    { data: null, error: { message: "table missing" } },
    { data: { venue_name: "incomplete" }, error: null },
  ])("falls back for home but gives admin an explicit error", async (response) => {
    mocks.single.mockResolvedValue(response);
    expect(await readEventSettings()).toEqual({ settings: DEFAULT_EVENT_SETTINGS, error: expect.stringContaining("0005_event_settings.sql") });
  });
  it("recovers after the database becomes available and reads again", async () => {
    mocks.single.mockRejectedValueOnce(new Error("network"));
    expect((await readEventSettings()).error).not.toBeNull();
    mocks.single.mockResolvedValue({ data: eventSettingsToRow(DEFAULT_EVENT_SETTINGS), error: null });
    expect((await readEventSettings()).error).toBeNull();
  });
});
