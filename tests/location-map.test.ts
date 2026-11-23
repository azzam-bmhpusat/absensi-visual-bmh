import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCATION_DATA } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS } from "@/lib/event-settings";

const harness = vi.hoisted(() => ({
  effect: undefined as (() => (() => void) | undefined) | undefined,
  effects: [] as (() => (() => void) | undefined)[],
  refs: [] as { current: unknown }[],
  refIndex: 0,
  status: vi.fn(),
  container: {},
  callbacks: new Map<string, () => void>(),
  map: {
    on: vi.fn(), off: vi.fn(), remove: vi.fn(), resize: vi.fn(),
    addControl: vi.fn(), getCanvas: vi.fn(), setCenter: vi.fn(),
  },
  marker: { setLngLat: vi.fn(), setPopup: vi.fn(), addTo: vi.fn(), remove: vi.fn(), on: vi.fn(), off: vi.fn(), getLngLat: vi.fn(), getElement: vi.fn() },
  popup: { setDOMContent: vi.fn(), remove: vi.fn() },
  construct: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: () => (() => void) | undefined) => { harness.effect = effect; harness.effects.push(effect); },
  useRef: (initial: unknown) => {
    const index = harness.refIndex++;
    return harness.refs[index] ??= { current: index === 0 ? harness.container : initial };
  },
  useState: () => ["loading", harness.status],
}));

vi.mock("maplibre-gl", () => ({
  Map: class {
    constructor(options: unknown) {
      harness.construct(options);
      return harness.map;
    }
  },
  Marker: class { constructor() { return harness.marker; } },
  Popup: class { constructor() { return harness.popup; } },
  NavigationControl: class {},
  AttributionControl: class {},
}));

import { LocationMap } from "@/components/rakernas/location-map";

describe("LocationMap lifecycle", () => {
  let intersect: (entries: { isIntersecting: boolean }[]) => void;
  let resize: () => void;
  let intersectionDisconnect: ReturnType<typeof vi.fn>;
  let resizeDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    harness.callbacks.clear();
    harness.construct.mockReset();
    harness.effect = undefined;
    harness.effects = [];
    harness.refs = [];
    harness.refIndex = 0;
    intersectionDisconnect = vi.fn();
    resizeDisconnect = vi.fn();
    vi.stubGlobal("IntersectionObserver", class {
      constructor(callback: typeof intersect) { intersect = callback; }
      observe = vi.fn();
      disconnect = intersectionDisconnect;
    });
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) { resize = callback; }
      observe = vi.fn();
      disconnect = resizeDisconnect;
    });
    vi.stubGlobal("document", {
      createElement: () => ({ setAttribute: vi.fn(), append: vi.fn() }),
    });
    harness.map.on.mockImplementation((event, callback) => {
      harness.callbacks.set(event, callback);
      return harness.map;
    });
    harness.map.getCanvas.mockReturnValue({ setAttribute: vi.fn() });
    harness.marker.setLngLat.mockReturnValue(harness.marker);
    harness.marker.setPopup.mockReturnValue(harness.marker);
    harness.marker.addTo.mockReturnValue(harness.marker);
    harness.marker.getElement.mockReturnValue({ setAttribute: vi.fn() });
    harness.marker.getLngLat.mockReturnValue({ lng: 106.823191, lat: -6.148531 });
    harness.popup.setDOMContent.mockReturnValue(harness.popup);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function flushImport() {
    await vi.waitFor(() => expect(harness.construct).toHaveBeenCalled());
  }

  it("menunda inisialisasi sampai terlihat, memakai titik resmi, resize, dan membersihkan resource", async () => {
    LocationMap();
    const cleanup = harness.effect?.();
    expect(harness.construct).not.toHaveBeenCalled();
    intersect([{ isIntersecting: false }]);
    expect(harness.construct).not.toHaveBeenCalled();
    intersect([{ isIntersecting: true }]);
    await flushImport();
    expect(harness.construct).toHaveBeenCalledWith(expect.objectContaining({
      center: LOCATION_DATA.map.coordinates,
      style: LOCATION_DATA.map.styleUrl,
      zoom: 15,
      cooperativeGestures: true,
    }));
    expect(harness.marker.setLngLat).toHaveBeenCalledWith(LOCATION_DATA.map.coordinates);
    harness.callbacks.get("load")?.();
    expect(harness.status).toHaveBeenLastCalledWith("ready");
    resize();
    expect(harness.map.resize).toHaveBeenCalledOnce();
    // Gangguan satu tile setelah load tidak membuang peta yang sudah tampil.
    harness.callbacks.get("error")?.();
    expect(harness.map.remove).not.toHaveBeenCalled();
    cleanup?.();
    expect(harness.map.remove).toHaveBeenCalledOnce();
    expect(harness.marker.remove).toHaveBeenCalledOnce();
    expect(harness.popup.remove).toHaveBeenCalledOnce();
    expect(resizeDisconnect).toHaveBeenCalled();
    expect(intersectionDisconnect).toHaveBeenCalled();
    expect(harness.map.off).toHaveBeenCalledWith("load", expect.any(Function));
    expect(harness.map.off).toHaveBeenCalledWith("error", expect.any(Function));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("tidak membuat peta jika komponen dilepas ketika import masih berlangsung", async () => {
    LocationMap();
    const cleanup = harness.effect?.();
    intersect([{ isIntersecting: true }]);
    cleanup?.();
    await vi.dynamicImportSettled();
    expect(harness.construct).not.toHaveBeenCalled();
    expect(harness.status).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("menampilkan fallback saat WebGL gagal diinisialisasi", async () => {
    harness.construct.mockImplementation(() => { throw new Error("WebGL unavailable"); });
    LocationMap();
    const cleanup = harness.effect?.();
    intersect([{ isIntersecting: true }]);
    await flushImport();
    expect(harness.status).toHaveBeenLastCalledWith("error");
    expect(vi.getTimerCount()).toBe(0);
    cleanup?.();
  });

  it("mengakhiri pemuatan yang macet dan membersihkan peta setelah 15 detik", async () => {
    LocationMap();
    const cleanup = harness.effect?.();
    intersect([{ isIntersecting: true }]);
    await flushImport();
    await vi.advanceTimersByTimeAsync(15_000);
    expect(harness.status).toHaveBeenLastCalledWith("error");
    expect(harness.map.remove).toHaveBeenCalledOnce();
    cleanup?.();
    expect(harness.map.remove).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("memilih koordinat melalui klik dan pin yang digeser, lalu melepas listener", async () => {
    const onLocationChange = vi.fn();
    LocationMap({ editable: true, onLocationChange });
    const cleanup = harness.effect?.();
    intersect([{ isIntersecting: true }]);
    await flushImport();
    const onClick = harness.callbacks.get("click") as unknown as (event: { lngLat: { lat: number; lng: number } }) => void;
    onClick({ lngLat: { lat: -6.2000004, lng: 466.8000002 } });
    expect(onLocationChange).toHaveBeenLastCalledWith(-6.2, 106.8);
    harness.marker.getLngLat.mockReturnValue({ lat: -7.1, lng: 110.2 });
    const onDrag = harness.marker.on.mock.calls.find(([event]) => event === "dragend")?.[1];
    expect(onDrag).toBeTypeOf("function");
    onDrag?.();
    expect(onLocationChange).toHaveBeenLastCalledWith(-7.1, 110.2);
    vi.stubGlobal("Element", class { closest() { return true; } });
    const markerClick = onClick as unknown as (event: unknown) => void;
    markerClick({ lngLat: { lat: 0, lng: 0 }, originalEvent: { target: new Element() } });
    expect(onLocationChange).toHaveBeenCalledTimes(2);
    cleanup?.();
    expect(harness.map.off).toHaveBeenCalledWith("click", onClick);
    expect(harness.marker.off).toHaveBeenCalledWith("dragend", onDrag);
  });

  it("mengikuti koordinat dan teks manual tanpa membuat peta ulang", async () => {
    LocationMap();
    const cleanup = harness.effect?.();
    intersect([{ isIntersecting: true }]);
    await flushImport();
    harness.refIndex = 0;
    harness.effects = [];
    LocationMap({ location: { ...DEFAULT_EVENT_SETTINGS, latitude: -7.5, longitude: 110.4, venueName: "Aula Baru", venueAddress: "Alamat Baru" } });
    harness.effects[0]();
    expect(harness.marker.setLngLat).toHaveBeenLastCalledWith([110.4, -7.5]);
    expect(harness.map.setCenter).toHaveBeenLastCalledWith([110.4, -7.5]);
    expect(harness.construct).toHaveBeenCalledOnce();
    expect(harness.marker.getElement().setAttribute).toHaveBeenCalledWith("aria-label", "Lihat informasi Aula Baru");
    cleanup?.();
  });
});
