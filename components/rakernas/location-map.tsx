"use client";

import { useEffect, useRef, useState } from "react";
import type { Map, Marker, Popup } from "maplibre-gl";
import { LoaderCircle, MapPin } from "lucide-react";
import { LOCATION_DATA } from "@/content/rakernas";
import "maplibre-gl/dist/maplibre-gl.css";
import styles from "./location-map.module.css";

type MapStatus = "loading" | "ready" | "error";

export function LocationMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

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
      marker?.remove();
      popup?.remove();
      if (map) {
        map.off("load", onLoad);
        map.off("error", onError);
        map.remove();
        map = undefined;
      }
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
          center: LOCATION_DATA.map.coordinates,
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
        map.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
        map.addControl(new maplibre.AttributionControl({ compact: false }), "bottom-right");
        map.getCanvas().setAttribute("aria-label", `Peta interaktif ${LOCATION_DATA.hotel}`);

        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.className = styles.marker;
        markerButton.setAttribute("aria-label", `Lihat informasi ${LOCATION_DATA.hotel}`);
        const pin = document.createElement("span");
        pin.className = styles.pin;
        pin.setAttribute("aria-hidden", "true");
        markerButton.append(pin);

        const info = document.createElement("div");
        info.className = styles.popup;
        const title = document.createElement("h3");
        title.textContent = LOCATION_DATA.hotel;
        const address = document.createElement("p");
        address.textContent = LOCATION_DATA.address;
        info.append(title, address);
        popup = new maplibre.Popup({ offset: 30, maxWidth: "280px" }).setDOMContent(info);
        marker = new maplibre.Marker({ element: markerButton, anchor: "bottom" })
          .setLngLat(LOCATION_DATA.map.coordinates)
          .setPopup(popup)
          .addTo(map);

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
  }, []);

  return (
    <div className={styles.frame} role="region" aria-label={`Peta lokasi ${LOCATION_DATA.hotel}`}>
      <div ref={containerRef} className={styles.canvas} />
      {status !== "ready" && (
        <div className={styles.overlay}>
          {status === "error" ? <MapPin aria-hidden="true" /> : <LoaderCircle className={styles.spinner} aria-hidden="true" />}
          <p role="status">
            {status === "error" ? "Peta belum dapat ditampilkan." : "Memuat peta lokasi acara…"}
          </p>
          {status === "error" && (
            <a href={LOCATION_DATA.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.link}>
              Buka lokasi di Google Maps
            </a>
          )}
        </div>
      )}
    </div>
  );
}
