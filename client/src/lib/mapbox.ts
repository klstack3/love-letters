import type { LngLat } from "./globeData";

let tokenPromise: Promise<string> | null = null;

export function getMapboxToken(): Promise<string> {
  if (!tokenPromise) {
    tokenPromise = fetch("/api/config")
      .then((res) => res.json())
      .then((config) => (config.mapboxToken as string) || "")
      .catch(() => {
        tokenPromise = null;
        return "";
      });
  }
  return tokenPromise;
}

export interface GeocodeResult {
  coords: LngLat;
  label: string;
}

export async function geocodePlace(
  query: string
): Promise<GeocodeResult | null> {
  const token = await getMapboxToken();
  if (!token || !query.trim()) return null;

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "place,locality,region,district,country");
  url.searchParams.set("access_token", token);

  const res = await fetch(url);
  if (!res.ok) return null;
  const body = await res.json();
  const feature = body.features?.[0];
  if (!feature) return null;

  const [lng, lat] = feature.geometry.coordinates as LngLat;
  return {
    coords: [Number(lng.toFixed(4)), Number(lat.toFixed(4))],
    label: feature.properties?.full_address ?? feature.properties?.name ?? query,
  };
}
