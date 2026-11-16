import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LOCATION_DATA } from "@/content/rakernas";

const harness = vi.hoisted(() => ({
  effect: undefined as (() => (() => void) | undefined) | undefined,
  status: vi.fn(),
  container: {},
  callbacks: new Map<string, () => void>(),
  map: {
    on: vi.fn(), off: vi.fn(), remove: vi.fn(), resize: vi.fn(),
    addControl: vi.fn(), getCanvas: vi.fn(),
  },
  marker: { setLngLat: vi.fn(), setPopup: vi.fn(), addTo: vi.fn(), remove: vi.fn() },
  popup: { setDOMContent: vi.fn(), remove: vi.fn() },
  construct: vi.fn(),
}));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useEffect: (effect: typeof harness.effect) => { harness.effect = effect; },
  useRef: () => ({ current: harness.container }),
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
      zoom: 16,
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
});
