import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

export default function GlobeVisualization({ routes }: GlobeVisualizationProps) {
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

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        
        if (!config.mapboxToken) {
          console.error('MAPBOX_ACCESS_TOKEN is not set');
          return;
        }
        
        mapboxgl.accessToken = config.mapboxToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          projection: { name: 'globe' },
          center: [-30, 30],
          zoom: 1.5,
          pitch: 0,
          dragRotate: true,
          interactive: true,
        });

        map.current.on('style.load', () => {
          if (!map.current) return;

          // Set atmospheric effects with subtle white halo
          map.current.setFog({
            color: 'rgb(20, 20, 25)',
            'high-color': 'rgb(40, 40, 50)',
            'horizon-blend': 0.08,
            'space-color': 'rgb(0, 0, 5)',
            'star-intensity': 0.9
          });

          // Dark ocean color
          map.current.setPaintProperty('water', 'fill-color', '#050a14');
          
          // Dark land color
          map.current.setPaintProperty('land', 'background-color', '#050a14');

          // Hide all default labels from the base style
          const style = map.current.getStyle();
          if (style && style.layers) {
            style.layers.forEach((layer) => {
              if (layer.type === 'symbol' && layer.id.includes('label')) {
                map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
              }
            });
          }

          setMapLoaded(true);
        });

        map.current.on('load', () => {
          if (!map.current) return;

          // Add source for countries with promoteId to enable feature-state
          map.current.addSource('countries', {
            type: 'vector',
            url: 'mapbox://mapbox.country-boundaries-v1',
            promoteId: 'iso_3166_1'
          });

          // Add country fills layer
          map.current.addLayer({
            id: 'country-fills',
            type: 'fill',
            source: 'countries',
            'source-layer': 'country_boundaries',
            paint: {
              'fill-color': '#050a14',
              'fill-opacity': 1
            }
          });

          // Add blue/white gradient overlay for hover
          map.current.addLayer({
            id: 'country-hover-gradient',
            type: 'fill',
            source: 'countries',
            'source-layer': 'country_boundaries',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#c8e0ff',
                'transparent'
              ],
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                0.3,
                0
              ]
            }
          });

          // Add shimmery country borders
          map.current.addLayer({
            id: 'country-boundaries',
            type: 'line',
            source: 'countries',
            'source-layer': 'country_boundaries',
            paint: {
              'line-color': '#8ca3b8',
              'line-width': 1,
              'line-opacity': 0.6,
              'line-blur': 0.5
            }
          });

          // Add country labels with distance-based fade
          map.current.addLayer({
            id: 'country-labels',
            type: 'symbol',
            source: 'countries',
            'source-layer': 'country_boundaries',
            layout: {
              'text-field': ['get', 'name_en'],
              'text-size': 12,
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
              'text-pitch-alignment': 'map',
              'text-rotation-alignment': 'map',
              'text-max-angle': 45
            },
            paint: {
              'text-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#ffffff',
                '#556677'
              ],
              'text-halo-color': '#000000',
              'text-halo-width': 1,
              'text-opacity': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                1,
                ['coalesce', ['feature-state', 'opacity'], 0.7]
              ]
            }
          });
          
          const nav = new mapboxgl.NavigationControl({
            visualizePitch: true,
            showCompass: true,
            showZoom: true,
          });
          map.current.addControl(nav, 'top-right');

          // Update label opacity based on distance from center
          const updateLabelOpacity = () => {
            if (!map.current) return;
            
            const center = map.current.getCenter();
            const features = map.current.querySourceFeatures('countries', {
              sourceLayer: 'country_boundaries'
            });

            features.forEach((feature) => {
              if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
                const countryId = feature.properties?.iso_3166_1;
                if (!countryId) return;

                // Get the center of the country (approximate)
                const bounds = feature.properties;
                let featureLng = 0;
                let featureLat = 0;

                // Use a simple centroid calculation
                if (feature.geometry.type === 'Polygon') {
                  const coords = feature.geometry.coordinates[0];
                  if (coords && coords.length > 0) {
                    featureLng = coords[0][0];
                    featureLat = coords[0][1];
                  }
                }

                // Calculate angular distance from center
                const dLng = Math.abs(featureLng - center.lng);
                const dLat = Math.abs(featureLat - center.lat);
                const distance = Math.sqrt(dLng * dLng + dLat * dLat);

                // Map distance to opacity (0.7 at center, 0 at ~90 degrees away)
                const maxDistance = 90;
                const opacity = Math.max(0, Math.min(0.7, 0.7 * (1 - distance / maxDistance)));

                map.current?.setFeatureState(
                  { source: 'countries', sourceLayer: 'country_boundaries', id: countryId },
                  { opacity }
                );
              }
            });
          };

          // Update opacity on map move
          map.current.on('move', updateLabelOpacity);
          map.current.on('zoom', updateLabelOpacity);
          updateLabelOpacity(); // Initial update

          // Hover interaction for countries
          let hoveredCountryId: string | null = null;

          map.current.on('mousemove', 'country-fills', (e) => {
            if (!map.current) return;
            
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const countryId = feature.properties?.iso_3166_1 as string | undefined;
              
              if (!countryId) return;
              
              if (hoveredCountryId && hoveredCountryId !== countryId) {
                map.current.setFeatureState(
                  { source: 'countries', sourceLayer: 'country_boundaries', id: hoveredCountryId },
                  { hover: false }
                );
              }
              
              hoveredCountryId = countryId;
              map.current.setFeatureState(
                { source: 'countries', sourceLayer: 'country_boundaries', id: countryId },
                { hover: true }
              );
              
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'country-fills', () => {
            if (!map.current || !hoveredCountryId) return;
            
            map.current.setFeatureState(
              { source: 'countries', sourceLayer: 'country_boundaries', id: hoveredCountryId },
              { hover: false }
            );
            hoveredCountryId = null;
            map.current.getCanvas().style.cursor = '';
          });

          // Add route lines and markers
          const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
            const R = 6371; // Earth's radius in km
            const lat1 = coord1[1] * Math.PI / 180;
            const lat2 = coord2[1] * Math.PI / 180;
            const dLat = (coord2[1] - coord1[1]) * Math.PI / 180;
            const dLon = (coord2[0] - coord1[0]) * Math.PI / 180;

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            return Math.round(R * c);
          };

          // Create route lines with gradient
          routes.forEach((route, index) => {
            if (!map.current) return;

            const distance = calculateDistance(route.coords[0], route.coords[1]);

            // Add route line source
            map.current.addSource(`route-${index}`, {
              type: 'geojson',
              lineMetrics: true,
              data: {
                type: 'Feature',
                properties: { distance, from: route.from, to: route.to },
                geometry: {
                  type: 'LineString',
                  coordinates: [route.coords[0], route.coords[1]]
                }
              }
            });

            // Add pulsing line layer
            map.current.addLayer({
              id: `route-line-${index}`,
              type: 'line',
              source: `route-${index}`,
              paint: {
                'line-color': route.color[0],
                'line-width': 2,
                'line-opacity': 0.6,
                'line-gradient': [
                  'interpolate',
                  ['linear'],
                  ['line-progress'],
                  0, route.color[0],
                  1, route.color[1]
                ]
              },
              layout: {
                'line-cap': 'round',
                'line-join': 'round'
              }
            });

            // Add pulsing animation layer
            map.current.addLayer({
              id: `route-pulse-${index}`,
              type: 'line',
              source: `route-${index}`,
              paint: {
                'line-color': route.color[1],
                'line-width': 3,
                'line-opacity': 0.4,
                'line-blur': 2
              },
              layout: {
                'line-cap': 'round',
                'line-join': 'round'
              }
            });
          });

          // Build location routes map
          locationRoutesRef.current.clear();
          routes.forEach((route) => {
            const distance = calculateDistance(route.coords[0], route.coords[1]);
            
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
              color: route.color[0]
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
              
              const originEl = document.createElement('div');
              originEl.className = 'location-marker';
              originEl.style.cssText = `
                width: 10px;
                height: 10px;
                background: ${route.color[0]};
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                box-shadow: 0 0 10px ${route.color[0]}80;
                cursor: pointer;
                transition: all 0.3s ease;
              `;
              originEl.dataset.locationKey = originKey;
              originEl.dataset.locationName = route.from;

              const originMarker = new mapboxgl.Marker({ element: originEl })
                .setLngLat(route.coords[0])
                .addTo(map.current);
              
              markersRef.current.push(originMarker);
            }

            // Add destination marker
            const destKey = `${route.coords[1][0]},${route.coords[1][1]}`;
            if (!addedLocations.has(destKey)) {
              addedLocations.add(destKey);
              
              const destEl = document.createElement('div');
              destEl.className = 'location-marker';
              destEl.style.cssText = `
                width: 10px;
                height: 10px;
                background: ${route.color[1]};
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                box-shadow: 0 0 10px ${route.color[1]}80;
                cursor: pointer;
                transition: all 0.3s ease;
              `;
              destEl.dataset.locationKey = destKey;
              destEl.dataset.locationName = route.to;

              const destMarker = new mapboxgl.Marker({ element: destEl })
                .setLngLat(route.coords[1])
                .addTo(map.current);
              
              markersRef.current.push(destMarker);
            }
          });

          // Add hover interactions for markers
          document.addEventListener('mouseover', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('location-marker')) {
              target.style.transform = 'scale(1.5)';
              target.style.boxShadow = `0 0 20px ${target.style.background}`;
              
              const locationKey = target.dataset.locationKey || '';
              const locationName = target.dataset.locationName || '';
              const locationRoutes = locationRoutesRef.current.get(locationKey) || [];
              
              const rect = target.getBoundingClientRect();
              setHoveredLocation({
                name: locationName,
                routes: locationRoutes,
                x: rect.left + rect.width / 2,
                y: rect.top
              });
            }
          });

          document.addEventListener('mouseout', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('location-marker')) {
              target.style.transform = 'scale(1)';
              target.style.boxShadow = `0 0 10px ${target.style.background}80`;
              setHoveredLocation(null);
            }
          });

          // Animate continuous pulse effect
          let pulseOffset = 0;
          const animatePulse = () => {
            if (!map.current) return;
            
            pulseOffset = (pulseOffset + 0.005);
            
            routes.forEach((_, index) => {
              if (map.current?.getLayer(`route-pulse-${index}`)) {
                // Create continuous flowing dash pattern
                map.current.setPaintProperty(
                  `route-pulse-${index}`,
                  'line-dasharray',
                  [0.5, 1.5, 0.5]
                );
                map.current.setPaintProperty(
                  `route-pulse-${index}`,
                  'line-offset',
                  Math.sin(pulseOffset) * 0.5
                );
              }
            });
            
            requestAnimationFrame(animatePulse);
          };
          animatePulse();
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, [routes]);

  return (
    <div className="relative w-full h-screen bg-[#000005] overflow-hidden" data-testid="globe-container">
      {/* Globe halo effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.06) 0%, rgba(200, 200, 210, 0.03) 40%, transparent 60%)',
        }}
      />
      
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{
          filter: 'brightness(1.05) contrast(1.1)',
        }}
      />
      
      {/* Shimmer overlay effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
          animation: 'shimmer 8s ease-in-out infinite',
        }}
      />

      {/* Distance tooltip */}
      {hoveredLocation && hoveredLocation.routes.length > 0 && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: `${hoveredLocation.x}px`,
            top: `${hoveredLocation.y - 80}px`,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="bg-black/90 text-white px-3 py-2 rounded-lg border border-white/20 backdrop-blur-sm">
            <div className="text-sm font-medium mb-2">{hoveredLocation.name}</div>
            {hoveredLocation.routes.map((route, idx) => (
              <div key={idx} className="text-xs mt-1" style={{ color: route.color }}>
                <span className="font-medium">{route.person}:</span> {route.from} → {route.distance.toLocaleString()} km
                <div className="text-white/60 text-[10px]">{route.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
