import { TRANSPORT_DATA, type TransportItem } from "@/content/rakernas";

export function buildTransportDirectionsUrl(item: TransportItem, travelMode: TransportItem["travelMode"] = item.travelMode): string {
  const params = new URLSearchParams({
    api: "1",
    origin: item.mapsQuery,
    destination: `${TRANSPORT_DATA.destination.name}, ${TRANSPORT_DATA.destination.address}`,
    travelmode: travelMode,
  });
  return `https://www.google.com/maps/dir/?${params}`;
}
