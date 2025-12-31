import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import countryLabels from "@/data/country-labels.json";

export interface RouteData {
  from: string;
  to: string;
  coords: [[number, number], [number, number]];
  color: [string, string];
  date: string;
  meetup: boolean;
  person: string;
}

interface GlobeVisualizationProps {
  routes: RouteData[];
}

interface LocationRoute {
  person: string;
  from: string;
  distance: number;
  date: string;
  color: string;
}

// Helper function to calculate distance using Haversine formula
function calculateDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const R = 6371; // Earth's radius in km
  const lat1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[1] * Math.PI) / 180;
  const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
  const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Mapping of destinations to continents
const destinationToContinent: Record<string, string> = {
  "Kelowna, BC, Canada": "North America",
  "New York, NY, USA": "North America",
  "Colorado, USA": "North America",
  "Goa, India": "Asia",
  "London, UK": "Europe",
};

// Mapping of destinations to countries
const destinationToCountry: Record<string, string> = {
  "Kelowna, BC, Canada": "Canada",
  "New York, NY, USA": "USA",
  "Colorado, USA": "USA",
  "Goa, India": "India",
  "London, UK": "UK",
};

export default function GlobeVisualization({
  routes,
}: GlobeVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState<{
    name: string;
    routes: LocationRoute[];
    x: number;
    y: number;
  } | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const locationRoutesRef = useRef<Map<string, LocationRoute[]>>(new Map());

  // Calculate statistics
  const stats = (() => {
    let totalDistance = 0;
    const continents = new Set<string>();
    const countries = new Set<string>();

    routes.forEach((route) => {
      // Calculate and add distance
      const distance = calculateDistance(route.coords[0], route.coords[1]);
      totalDistance += distance;

      // Add continent and country from destination
      const continent = destinationToContinent[route.to];
      const country = destinationToCountry[route.to];

      if (continent) continents.add(continent);
      if (country) countries.add(country);
    });

    return {
      totalDistance,
      totalContinents: continents.size,
      totalCountries: countries.size,
    };
  })();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const response = await fetch("/api/config");
        const config = await response.json();

        if (!config.mapboxToken) {
          console.error("MAPBOX_ACCESS_TOKEN is not set");
          return;
        }

        mapboxgl.accessToken = config.mapboxToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          projection: { name: "globe" },
          center: [-30, 30],
          zoom: 2.5,
          pitch: 0,
          dragRotate: true,
          interactive: true,
        });

        map.current.on("style.load", () => {
          if (!map.current) return;

          // Set atmospheric effects with subtle white halo
          map.current.setFog({
            color: "rgb(20, 20, 25)",
            "high-color": "rgb(40, 40, 50)",
            "horizon-blend": 0.08,
            "space-color": "rgb(0, 0, 5)",
            "star-intensity": 0.9,
          });

          // Dark ocean color
          map.current.setPaintProperty("water", "fill-color", "#050a14");

          // Dark land color
          map.current.setPaintProperty("land", "background-color", "#050a14");

          // Hide all default labels from the base style
          const style = map.current.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer) => {
              if (layer.type === "symbol" && layer.id.includes("label")) {
                map.current?.setLayoutProperty(layer.id, "visibility", "none");
              }
            });
          }

          setMapLoaded(true);
        });

        map.current.on("load", () => {
          if (!map.current) return;

          // Add source for countries with promoteId to enable feature-state
          map.current.addSource("countries", {
            type: "vector",
            url: "mapbox://mapbox.country-boundaries-v1",
            promoteId: "iso_3166_1",
          });

          // Add country fills layer
          map.current.addLayer({
            id: "country-fills",
            type: "fill",
            source: "countries",
            "source-layer": "country_boundaries",
            paint: {
              "fill-color": "#1a2332",
              "fill-opacity": 1,
            },
          });

          // Add blue/white gradient overlay for hover
          map.current.addLayer({
            id: "country-hover-gradient",
            type: "fill",
            source: "countries",
            "source-layer": "country_boundaries",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#c8e0ff",
                "transparent",
              ],
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.3,
                0,
              ],
            },
          });

          // Add shimmery country borders
          map.current.addLayer({
            id: "country-boundaries",
            type: "line",
            source: "countries",
            "source-layer": "country_boundaries",
            paint: {
              "line-color": "#8ca3b8",
              "line-width": 1,
              "line-opacity": 0.6,
              "line-blur": 0.5,
            },
          });

          // Add curated country labels from our GeoJSON source
          map.current.addSource("country-labels", {
            type: "geojson",
            data: countryLabels as any,
          });

          map.current.addLayer({
            id: "country-labels",
            type: "symbol",
            source: "country-labels",
            layout: {
              "text-field": ["get", "name"],
              "text-size": 12,
              "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
              "text-allow-overlap": false,
              "text-max-width": 8,
            },
            paint: {
              "text-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#ffffff",
                "#556677",
              ],
              "text-halo-color": "#000000",
              "text-halo-width": 1,
              "text-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                1.0,
                ["boolean", ["feature-state", "hideForHover"], false],
                0,
                ["coalesce", ["feature-state", "opacity"], 0.7],
              ],
            },
          });

          const nav = new mapboxgl.NavigationControl({
            visualizePitch: true,
            showCompass: true,
            showZoom: true,
          });
          map.current.addControl(nav, "top-right");

          // Update label opacity based on distance from center
          const updateLabelOpacity = () => {
            if (!map.current) return;

            const center = map.current.getCenter();

            // Query our curated label source features
            const labelSource = map.current.getSource(
              "country-labels"
            ) as mapboxgl.GeoJSONSource;
            if (!labelSource) return;

            // Get the data from our source
            const data = countryLabels as any;

            data.features.forEach((feature: any) => {
              const iso = feature.properties.iso;
              const coords = feature.geometry.coordinates;
              const featureLng = coords[0];
              const featureLat = coords[1];

              // Calculate angular distance from center
              const dLng = Math.abs(featureLng - center.lng);
              const dLat = Math.abs(featureLat - center.lat);
              const distance = Math.sqrt(dLng * dLng + dLat * dLat);

              // Map distance to opacity (0.8 at center, 0.3 minimum even when far)
              const maxDistance = 90;
              const fadeAmount = Math.min(1, distance / maxDistance);
              const opacity = 0.8 - fadeAmount * 0.5; // Fades from 0.8 to 0.3

              // Set opacity on label feature (use iso code as ID)
              map.current?.setFeatureState(
                { source: "country-labels", id: iso },
                { opacity }
              );
            });
          };

          // Update opacity on map move
          map.current.on("move", updateLabelOpacity);
          map.current.on("zoom", updateLabelOpacity);
          updateLabelOpacity(); // Initial update

          // Hover interaction for countries
          let hoveredCountryId: string | null = null;

          map.current.on("mousemove", "country-fills", (e) => {
            if (!map.current) return;

            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const countryId = feature.properties?.iso_3166_1 as
                | string
                | undefined;

              if (!countryId) return;

              if (hoveredCountryId && hoveredCountryId !== countryId) {
                // Clear hover from previous country fill
                map.current.setFeatureState(
                  {
                    source: "countries",
                    sourceLayer: "country_boundaries",
                    id: hoveredCountryId,
                  },
                  { hover: false }
                );

                // Clear hover from previous label (if exists in our curated set)
                map.current.setFeatureState(
                  { source: "country-labels", id: hoveredCountryId },
                  { hover: false }
                );
              }

              hoveredCountryId = countryId;

              // Set hover on country fill
              map.current.setFeatureState(
                {
                  source: "countries",
                  sourceLayer: "country_boundaries",
                  id: countryId,
                },
                { hover: true }
              );

              // Set hover on label (if exists in our curated set)
              map.current.setFeatureState(
                { source: "country-labels", id: countryId },
                { hover: true }
              );

              // Hide all other labels
              countryLabels.features.forEach((f: any) => {
                if (f.id !== countryId) {
                  map.current?.setFeatureState(
                    { source: "country-labels", id: f.id },
                    { hideForHover: true }
                  );
                } else {
                  map.current?.setFeatureState(
                    { source: "country-labels", id: f.id },
                    { hideForHover: false }
                  );
                }
              });

              map.current.getCanvas().style.cursor = "pointer";
            }
          });

          map.current.on("mouseleave", "country-fills", () => {
            if (!map.current || !hoveredCountryId) return;

            // Clear hover from country fill
            map.current.setFeatureState(
              {
                source: "countries",
                sourceLayer: "country_boundaries",
                id: hoveredCountryId,
              },
              { hover: false }
            );

            // Clear hover from label
            map.current.setFeatureState(
              { source: "country-labels", id: hoveredCountryId },
              { hover: false }
            );

            // Clear hideForHover from ALL labels
            countryLabels.features.forEach((f: any) => {
              map.current?.setFeatureState(
                { source: "country-labels", id: f.id },
                { hideForHover: false }
              );
            });

            hoveredCountryId = null;
            map.current.getCanvas().style.cursor = "";
          });

          // Add route lines and markers
          const calculateDistance = (
            coord1: [number, number],
            coord2: [number, number]
          ): number => {
            const R = 6371; // Earth's radius in km
            const lat1 = (coord1[1] * Math.PI) / 180;
            const lat2 = (coord2[1] * Math.PI) / 180;
            const dLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
            const dLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) *
                Math.cos(lat2) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return Math.round(R * c);
          };

          // Create route lines with gradient
          routes.forEach((route, index) => {
            if (!map.current) return;

            const distance = calculateDistance(
              route.coords[0],
              route.coords[1]
            );

            // Add route line source
            map.current.addSource(`route-${index}`, {
              type: "geojson",
              lineMetrics: true,
              data: {
                type: "Feature",
                properties: { distance, from: route.from, to: route.to },
                geometry: {
                  type: "LineString",
                  coordinates: [route.coords[0], route.coords[1]],
                },
              },
            });

            // Add pulsing line layer
            map.current.addLayer({
              id: `route-line-${index}`,
              type: "line",
              source: `route-${index}`,
              paint: {
                "line-color": route.color[0],
                "line-width": 2,
                "line-opacity": 0.6,
                "line-gradient": [
                  "interpolate",
                  ["linear"],
                  ["line-progress"],
                  0,
                  route.color[0],
                  1,
                  route.color[1],
                ],
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });

            // Add pulsing animation layer
            map.current.addLayer({
              id: `route-pulse-${index}`,
              type: "line",
              source: `route-${index}`,
              paint: {
                "line-color": route.color[1],
                "line-width": 3,
                "line-opacity": 0.5,
                "line-blur": 2,
                "line-dasharray": [0, 2, 1],
              },
              layout: {
                "line-cap": "round",
                "line-join": "round",
              },
            });
          });

          // Build location routes map
          locationRoutesRef.current.clear();
          routes.forEach((route) => {
            const distance = calculateDistance(
              route.coords[0],
              route.coords[1]
            );

            // Add to destination location
            const destKey = `${route.coords[1][0]},${route.coords[1][1]}`;
            if (!locationRoutesRef.current.has(destKey)) {
              locationRoutesRef.current.set(destKey, []);
            }
            locationRoutesRef.current.get(destKey)!.push({
              person: route.person,
              from: route.from,
              distance,
              date: route.date,
              color: route.color[0],
            });
          });

          // Add location markers
          const addedLocations = new Set<string>();

          routes.forEach((route) => {
            if (!map.current) return;

            // Add origin marker
            const originKey = `${route.coords[0][0]},${route.coords[0][1]}`;
            if (!addedLocations.has(originKey)) {
              addedLocations.add(originKey);

              const originEl = document.createElement("div");
              originEl.className = "location-marker";
              originEl.dataset.locationKey = originKey;
              originEl.dataset.locationName = route.from;
              originEl.style.cssText = `
                width: 10px;
                height: 10px;
                background: ${route.color[0]};
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                box-shadow: 0 0 10px ${route.color[0]}80;
                cursor: pointer;
                transition: all 0.3s ease;
                pointer-events: all;
              `;

              // Add hover handlers directly
              originEl.addEventListener("mouseenter", () => {
                originEl.style.transform = "scale(1.5)";
                originEl.style.boxShadow = `0 0 20px ${route.color[0]}`;

                const locationRoutes =
                  locationRoutesRef.current.get(originKey) || [];
                const rect = originEl.getBoundingClientRect();

                setHoveredLocation({
                  name: route.from,
                  routes: locationRoutes,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              });

              originEl.addEventListener("mouseleave", () => {
                originEl.style.transform = "scale(1)";
                originEl.style.boxShadow = `0 0 10px ${route.color[0]}80`;
                setHoveredLocation(null);
              });

              const originMarker = new mapboxgl.Marker({ element: originEl })
                .setLngLat(route.coords[0])
                .addTo(map.current);

              markersRef.current.push(originMarker);
            }

            // Add destination marker (map pin icon)
            const destKey = `${route.coords[1][0]},${route.coords[1][1]}`;
            if (!addedLocations.has(destKey)) {
              addedLocations.add(destKey);

              const destEl = document.createElement("div");
              destEl.className = "location-marker location-pin";
              destEl.dataset.locationKey = destKey;
              destEl.dataset.locationName = route.to;
              destEl.style.cssText = `
                width: 24px;
                height: 32px;
                cursor: pointer;
                transition: transform 0.3s ease;
                pointer-events: all;
                transform-origin: center bottom;
                background: transparent;
                border: none;
                outline: none;
              `;

              // SVG pin icon
              destEl.innerHTML = `
                <svg width="24" height="32" viewBox="0 0 24 32" style="filter: drop-shadow(0 0 8px ${route.color[1]}80); pointer-events: none;">
                  <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 19 9 19s9-12.25 9-19c0-4.97-4.03-9-9-9z" 
                    fill="${route.color[1]}" 
                    stroke="rgba(255, 255, 255, 0.4)" 
                    stroke-width="1.5"/>
                  <circle cx="12" cy="9" r="3" fill="rgba(0, 0, 0, 0.3)"/>
                </svg>
              `;

              // Add hover handlers directly
              destEl.addEventListener("mouseenter", () => {
                destEl.style.transform = "scale(1.3)";

                const locationRoutes =
                  locationRoutesRef.current.get(destKey) || [];
                const rect = destEl.getBoundingClientRect();

                setHoveredLocation({
                  name: route.to,
                  routes: locationRoutes,
                  x: rect.left + rect.width / 2,
                  y: rect.top,
                });
              });

              destEl.addEventListener("mouseleave", () => {
                destEl.style.transform = "scale(1)";
                setHoveredLocation(null);
              });

              const destMarker = new mapboxgl.Marker({
                element: destEl,
                anchor: "bottom",
              })
                .setLngLat(route.coords[1])
                .addTo(map.current);

              markersRef.current.push(destMarker);
            }
          });

          // Animate continuous pulse effect with flowing dashes
          let dashOffset = 0;
          let lastTime = 0;
          const animatePulse = (currentTime: number = 0) => {
            if (!map.current) return;

            // Throttle animation to ~30fps instead of 60fps for better performance
            if (currentTime - lastTime < 33) {
              requestAnimationFrame(animatePulse);
              return;
            }
            lastTime = currentTime;

            dashOffset = (dashOffset + 0.03) % 2;

            // Batch all map operations together
            routes.forEach((_, index) => {
              const layerId = `route-pulse-${index}`;
              if (map.current?.getLayer(layerId)) {
                // Ensure values are always positive
                const gap = Math.max(0.1, 2 - dashOffset);
                const dash = Math.max(0.1, 1 + dashOffset);
                try {
                  map.current.setPaintProperty(layerId, "line-dasharray", [
                    0,
                    gap,
                    dash,
                  ]);
                } catch (e) {
                  // Ignore errors if layer is not ready
                }
              }
            });

            requestAnimationFrame(animatePulse);
          };
          requestAnimationFrame(animatePulse);
        });
      } catch (error) {
        console.error("Failed to initialize map:", error);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [routes]);

  return (
    <div
      className="relative w-full h-screen bg-[#000005] overflow-hidden"
      data-testid="globe-container"
    >
      {/* Globe halo effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.06) 0%, rgba(200, 200, 210, 0.03) 40%, transparent 60%)",
        }}
      />

      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{
          filter: "brightness(1.05) contrast(1.1)",
        }}
      />

      {/* Shimmer overlay effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      {/* Distance tooltip */}
      {hoveredLocation && hoveredLocation.routes.length > 0 && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${hoveredLocation.x}px`,
            top: `${hoveredLocation.y - 80}px`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
            <div className="text-sm font-medium mb-2">
              {hoveredLocation.name}
            </div>
            {hoveredLocation.routes.map((route, idx) => (
              <div key={idx} className="text-xs mt-1 flex items-start gap-2">
                <div
                  className="w-3 h-3 mt-0.5 flex-shrink-0"
                  style={{
                    backgroundColor: route.color,
                    boxShadow: `0 0 4px ${route.color}`,
                  }}
                />
                <div className="flex-1">
                  <div className="text-white/90">
                    {route.from} → {route.distance.toLocaleString()} km
                  </div>
                  <div className="text-white/60 text-[10px]">{route.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics panel - bottom left */}
      <div
        className="absolute bottom-6 left-6 z-50 pointer-events-none"
        data-testid="stats-panel"
      >
        <div className="text-white font-mono text-sm space-y-1">
          <div data-testid="stat-distance">
            Distance: {stats.totalDistance.toLocaleString()} km
          </div>
          <div data-testid="stat-continents">
            Continents: {stats.totalContinents}
          </div>
          <div data-testid="stat-countries">
            Countries: {stats.totalCountries}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        
        .mapboxgl-ctrl-logo,
        .mapboxgl-ctrl-attrib,
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
