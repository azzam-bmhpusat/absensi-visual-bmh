import { describe, expect, it } from "vitest";
import { addCalendarDays, DEFAULT_EVENT_SETTINGS, formatEventDateRange, formatEventOpening, fromWibDateTime, getEventDays, getEventStatus, toWibDateTime } from "@/lib/event-settings";
import { eventSettingsFormSchema, eventSettingsFromRow, eventSettingsToRow, toEventSettingsForm } from "@/lib/event-settings-validation";
import { getDefaultDay, getTimeLeft } from "@/lib/rakernas-helpers";

describe("Event settings validation and WIB calendar", () => {
  const values = toEventSettingsForm(DEFAULT_EVENT_SETTINGS);

  it("preserves current defaults and round-trips storage without inventing a finish time", () => {
    const result = eventSettingsFormSchema.parse(values);
    expect(result.startsAt).toBe("2026-12-01T03:00:00.000Z");
    expect(result.endsAt).toBeNull();
    expect(result.footerUrl).toBe("https://wa.me/6289517795206");
    expect(eventSettingsFromRow(eventSettingsToRow(result))).toEqual(result);
  });

  it.each([
    ["latitude", ""], ["latitude", "91"], ["latitude", "NaN"], ["latitude", "Infinity"],
    ["longitude", "-181"], ["longitude", "abc"], ["venueName", "   "], ["venueAddress", ""],
    ["mapsUrl", "http://maps.google.com"], ["mapsUrl", "javascript:alert(1)"],
    ["footerUrl", "https://user:password@example.com"], ["footerUrl", "//example.com"],
    ["startsAtLocal", "2027-02-29T10:00"], ["startsAtLocal", "2026-12-01T24:00"],
    ["startsAtLocal", "2026-12-01"], ["endTime", "24:00"], ["endTime", "12:60"],
    ["startsAtLocal", "0000-01-01T10:00"], ["startsAtLocal", "9999-12-31T10:00"],
  ])("rejects invalid %s: %s", (field, value) => {
    expect(eventSettingsFormSchema.safeParse({ ...values, [field]: value }).success).toBe(false);
  });

  it("accepts coordinate boundaries and trims copy/HTTPS URLs", () => {
    const result = eventSettingsFormSchema.parse({ ...values, latitude: "-90", longitude: "180", venueName: "  Aula Baru  ", footerUrl: " https://example.com/panitia " });
    expect(result).toMatchObject({ latitude: -90, longitude: 180, venueName: "Aula Baru", footerUrl: "https://example.com/panitia" });
  });

  it("sets the optional finish on the third WIB calendar day across the year boundary", () => {
    const result = eventSettingsFormSchema.parse({ ...values, startsAtLocal: "2026-12-31T23:30", endTime: "00:15" });
    expect(result.startsAt).toBe("2026-12-31T16:30:00.000Z");
    expect(result.endsAt).toBe("2027-01-01T17:15:00.000Z");
    expect(toEventSettingsForm(result).endTime).toBe("00:15");
    expect(getEventDays(result.startsAt)).toEqual(["2026-12-31", "2027-01-01", "2027-01-02"]);
  });

  it("rejects corrupt database rows and a finish on a different day", () => {
    const row = eventSettingsToRow(DEFAULT_EVENT_SETTINGS);
    expect(eventSettingsFromRow({ ...row, latitude: null })).toBeNull();
    expect(eventSettingsFromRow({ ...row, starts_at: "invalid" })).toBeNull();
    expect(eventSettingsFromRow({ ...row, ends_at: "2026-12-02T10:00:00+07:00" })).toBeNull();
    expect(eventSettingsFromRow({ ...row, maps_url: "http://example.com" })).toBeNull();
  });

  it.each([
    ["2026-12-01T10:00:00+07:00", "01–03 Desember 2026"],
    ["2026-11-30T10:00:00+07:00", "30 November–02 Desember 2026"],
    ["2026-12-31T10:00:00+07:00", "31 Desember 2026–02 Januari 2027"],
    ["2028-02-28T10:00:00+07:00", "28 Februari–01 Maret 2028"],
  ])("formats all three dates for %s", (start, expected) => {
    expect(formatEventDateRange(start)).toBe(expected);
  });

  it("uses WIB at midnight and supports leap days without host timezone assumptions", () => {
    expect(toWibDateTime("2026-12-31T17:05:00Z")).toBe("2027-01-01T00:05");
    expect(fromWibDateTime("2028-02-29T00:00")).toBe("2028-02-28T17:00:00.000Z");
    expect(addCalendarDays("2026-02-30", 2)).toBe("");
    expect(formatEventOpening("2027-01-01T17:05:00Z")).toBe("02 Januari 2027, 00.05 WIB");
    expect(getDefaultDay("2027-01-01T17:00:00Z", "2026-12-31T10:00:00+07:00")).toBe("hari3");
    expect(getDefaultDay("2027-01-02T17:00:00Z", "2026-12-31T10:00:00+07:00")).toBe("hari1");
  });

  it("keeps countdown at zero after start and marks finished only after a configured finish", () => {
    const settings = eventSettingsFormSchema.parse({ ...values, endTime: "17:00" });
    expect(getEventStatus(settings, Date.parse("2026-12-01T02:59:59Z"))).toBe("upcoming");
    expect(getEventStatus(settings, Date.parse(settings.startsAt))).toBe("started");
    expect(getTimeLeft(settings.startsAt, settings.endsAt!).formatted).toEqual({ days: "00", hours: "00", minutes: "00", seconds: "00" });
    expect(getEventStatus(settings, Date.parse(settings.endsAt!))).toBe("finished");
    expect(getEventStatus({ ...settings, endsAt: null }, Date.parse("2030-01-01"))).toBe("started");
  });
});
