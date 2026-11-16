"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, Marker, Popup, MapMouseEvent } from "maplibre-gl";
import { LoaderCircle, MapPin } from "lucide-react";
import { LOCATION_DATA } from "@/content/rakernas";
import { DEFAULT_EVENT_SETTINGS, type EventSettings } from "@/lib/event-settings";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./location-map.module.css";

type MapStatus = "loading" | "ready" | "error";

type MapLocation = Pick<EventSettings, "venueName" | "venueAddress" | "mapsUrl" | "latitude" | "longitude">;

interface LocationMapProps {
  location?: MapLocation;
  editable?: boolean;
  onLocationChange?: (latitude: number, longitude: number) => void;
}

export function LocationMap({ location = DEFAULT_EVENT_SETTINGS, editable = false, onLocationChange }: LocationMapProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const latest = useRef({ location, onLocationChange });
  const runtime = useRef<{ map: Map; marker: Marker; title: HTMLElement; address: HTMLElement } | null>(null);

  useEffect(() => {
    latest.current = { location, onLocationChange };
    const active = runtime.current;
    if (!active) return;
    active.title.textContent = location.venueName;
    active.address.textContent = location.venueAddress;
    active.marker.getElement().setAttribute("aria-label", `Lihat informasi ${location.venueName}`);
    active.map.getCanvas().setAttribute("aria-label", `Peta interaktif ${location.venueName}`);
    const previous = active.marker.getLngLat();
    if (previous.lng !== location.longitude || previous.lat !== location.latitude) {
      active.marker.setLngLat([location.longitude, location.latitude]);
      active.map.setCenter([location.longitude, location.latitude]);
    }
  }, [location, onLocationChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let started = false;
    let loaded = false;
    let failed = false;
    let map: Map | undefined;
    let marker: Marker | undefined;
    let popup: Popup | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let loadTimeout: ReturnType<typeof setTimeout> | undefined;

    function destroyMap() {
      clearTimeout(loadTimeout);
      resizeObserver?.disconnect();
      marker?.off("dragend", onDragEnd);
      marker?.remove();
      popup?.remove();
      if (map) {
        map.off("load", onLoad);
        map.off("error", onError);
        map.off("click", onMapClick);
        map.remove();
        map = undefined;
      }
      runtime.current = null;
    }

    function selectPoint(latitude: number, longitude: number) {
      const wrappedLongitude = ((longitude + 180) % 360 + 360) % 360 - 180;
      marker?.setLngLat([wrappedLongitude, latitude]);
      latest.current.onLocationChange?.(Number(latitude.toFixed(6)), Number(wrappedLongitude.toFixed(6)));
    }

    function onMapClick(event: MapMouseEvent) {
      const target = event.originalEvent?.target;
      // Opening a popup or using controls must not select a different coordinate.
      if (target && target instanceof Element && target.closest("button, a, .maplibregl-popup, .maplibregl-ctrl")) return;
      selectPoint(event.lngLat.lat, event.lngLat.lng);
    }

    function onDragEnd() {
      const point = marker?.getLngLat();
      if (point) selectPoint(point.lat, point.lng);
    }

    function onLoad() {
      if (disposed || failed) return;
      loaded = true;
      clearTimeout(loadTimeout);
      setStatus("ready");
    }

    function fail() {
      if (disposed || failed) return;
      failed = true;
      destroyMap();
      setStatus("error");
    }

    function onError() {
      // Setelah peta tampil, gangguan satu tile tidak menutup seluruh peta.
      if (!loaded) fail();
    }

    async function initialize() {
      if (started || disposed) return;
      started = true;
      loadTimeout = setTimeout(fail, 15_000);

      try {
        const maplibre = await import("maplibre-gl");
        if (disposed || failed) return;

        map = new maplibre.Map({
          container: container!,
          style: LOCATION_DATA.map.styleUrl,
          center: [latest.current.location.longitude, latest.current.location.latitude],
          zoom: LOCATION_DATA.map.zoom,
          cooperativeGestures: true,
          dragRotate: false,
          touchPitch: false,
          attributionControl: false,
          locale: {
            "NavigationControl.ZoomIn": "Perbesar peta",
            "NavigationControl.ZoomOut": "Perkecil peta",
            "Popup.Close": "Tutup informasi lokasi",
            "CooperativeGesturesHandler.WindowsHelpText": "Gunakan Ctrl + gulir untuk memperbesar peta",
            "CooperativeGesturesHandler.MacHelpText": "Gunakan ⌘ + gulir untuk memperbesar peta",
            "CooperativeGesturesHandler.MobileHelpText": "Gunakan dua jari untuk menggeser peta",
          },
        });
        map.on("load", onLoad);
        map.on("error", onError);
        if (editable) map.on("click", onMapClick);
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.AttributionControl({ compact: false }), "bottom-right");
        map.getCanvas().setAttribute("aria-label", `Peta interaktif ${latest.current.location.venueName}`);

        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.className = styles.marker;
        markerButton.setAttribute("aria-label", `Lihat informasi ${latest.current.location.venueName}`);
        const pin = document.createElement("span");
        pin.className = styles.pin;
        pin.setAttribute("aria-hidden", "true");
        markerButton.append(pin);

        const info = document.createElement("div");
        info.className = styles.popup;
        const title = document.createElement("h3");
        title.textContent = latest.current.location.venueName;
        const address = document.createElement("p");
        address.textContent = latest.current.location.venueAddress;
        info.append(title, address);
        popup = new maplibre.Popup({ offset: 30, maxWidth: "280px" }).setDOMContent(info);
        marker = new maplibre.Marker({ element: markerButton, anchor: "bottom", draggable: editable })
          .setLngLat([latest.current.location.longitude, latest.current.location.latitude])
          .setPopup(popup)
          .addTo(map);
        if (editable) marker.on("dragend", onDragEnd);
        runtime.current = { map, marker, title, address };

        resizeObserver = new ResizeObserver(() => map?.resize());
        resizeObserver.observe(container!);
      } catch {
        // Termasuk browser tanpa WebGL atau kegagalan mengunduh library.
        fail();
      }
    }

    const observer = typeof IntersectionObserver === "undefined"
      ? undefined
      : new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            void initialize();
          }
        }, { rootMargin: "200px" });

    if (observer) observer.observe(container);
    else void initialize();

    return () => {
      disposed = true;
      observer?.disconnect();
      destroyMap();
    };
  }, [editable]);

  return (
    <div className={styles.frame} role="region" aria-label={`Peta lokasi ${location.venueName}`}>
      <div ref={containerRef} className={styles.canvas} />
      {status !== "ready" && (
        <div className={styles.overlay}>
          {status === "error" ? <MapPin aria-hidden="true" /> : <LoaderCircle className={styles.spinner} aria-hidden="true" />}
          <p role="status">
            {status === "error" ? "Peta belum dapat ditampilkan." : "Memuat peta lokasi acara…"}
          </p>
          {status === "error" && (
            <a href={location.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              Buka lokasi di Google Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}
