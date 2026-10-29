import { useEffect, useMemo, useState } from "react";
import type { RouteData } from "@/components/GlobeVisualization";
import {
  findMissingPlaces,
  toRouteData,
  type GlobeData,
  type LngLat,
} from "@/lib/globeData";
import { geocodePlace } from "@/lib/mapbox";

/**
 * Resolves names-only routes to drawable routes. Places typed by hand that
 * aren't in `places` yet are geocoded in the browser so they still show up.
 */
export function useGlobeRoutes(data: GlobeData): RouteData[] {
  const [geocoded, setGeocoded] = useState<Record<string, LngLat>>({});

  const missing = useMemo(() => findMissingPlaces(data), [data]);

  useEffect(() => {
    if (missing.length === 0) return;
    let cancelled = false;

    Promise.all(
      missing.map(async (name) => [name, await geocodePlace(name)] as const)
    ).then((results) => {
      if (cancelled) return;
      const found: Record<string, LngLat> = {};
      for (const [name, result] of results) {
        if (result) found[name] = result.coords;
        else console.warn(`Love Letters: couldn't find a location for "${name}"`);
      }
      setGeocoded(found);
    });

    return () => {
      cancelled = true;
    };
  }, [missing]);

  return useMemo(
    () => toRouteData({ ...data, places: { ...geocoded, ...data.places } }),
    [data, geocoded]
  );
}
