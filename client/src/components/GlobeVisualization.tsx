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
}

interface GlobeVisualizationProps {
  routes: RouteData[];
}

export default function GlobeVisualization({ routes }: GlobeVisualizationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

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

          // Set atmospheric effects with halo
          map.current.setFog({
            color: 'rgb(10, 20, 35)',
            'high-color': 'rgb(20, 35, 60)',
            'horizon-blend': 0.1,
            'space-color': 'rgb(0, 0, 5)',
            'star-intensity': 0.9
          });

          // Dark ocean color
          map.current.setPaintProperty('water', 'fill-color', '#050a14');
          
          // Dark land color
          map.current.setPaintProperty('land', 'background-color', '#050a14');

          // Add country fills layer first
          map.current.addLayer({
            id: 'country-fills',
            type: 'fill',
            source: {
              type: 'vector',
              url: 'mapbox://mapbox.country-boundaries-v1'
            },
            'source-layer': 'country_boundaries',
            paint: {
              'fill-color': '#050a14',
              'fill-opacity': 1
            }
          });

          // Add gradient overlay for hover (dark blue to white gradient effect)
          map.current.addLayer({
            id: 'country-hover-gradient',
            type: 'fill',
            source: {
              type: 'vector',
              url: 'mapbox://mapbox.country-boundaries-v1'
            },
            'source-layer': 'country_boundaries',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                'rgba(255, 255, 255, 0.25)',
                'transparent'
              ],
              'fill-opacity': 1
            }
          });

          // Add shimmery country borders on top
          map.current.addLayer({
            id: 'country-boundaries',
            type: 'line',
            source: {
              type: 'vector',
              url: 'mapbox://mapbox.country-boundaries-v1'
            },
            'source-layer': 'country_boundaries',
            paint: {
              'line-color': '#8ca3b8',
              'line-width': 1,
              'line-opacity': 0.6,
              'line-blur': 0.5
            }
          });

          // Add country labels
          map.current.addLayer({
            id: 'country-labels',
            type: 'symbol',
            source: {
              type: 'vector',
              url: 'mapbox://mapbox.country-boundaries-v1'
            },
            'source-layer': 'country_boundaries',
            layout: {
              'text-field': ['get', 'name_en'],
              'text-size': 12,
              'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
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
                0.7
              ]
            }
          });

          setMapLoaded(true);
        });

        map.current.on('load', () => {
          if (!map.current) return;
          
          const nav = new mapboxgl.NavigationControl({
            visualizePitch: true,
            showCompass: true,
            showZoom: true,
          });
          map.current.addControl(nav, 'top-right');

          // Add hover interaction for countries
          let hoveredStateId: string | number | null = null;

          map.current.on('mousemove', 'country-fills', (e) => {
            if (!map.current) return;
            
            if (e.features && e.features.length > 0) {
              if (hoveredStateId !== null) {
                map.current.setFeatureState(
                  { source: 'composite', sourceLayer: 'country_boundaries', id: hoveredStateId },
                  { hover: false }
                );
              }
              
              hoveredStateId = e.features[0].id!;
              map.current.setFeatureState(
                { source: 'composite', sourceLayer: 'country_boundaries', id: hoveredStateId },
                { hover: true }
              );
              
              map.current.getCanvas().style.cursor = 'pointer';
            }
          });

          map.current.on('mouseleave', 'country-fills', () => {
            if (!map.current) return;
            
            if (hoveredStateId !== null) {
              map.current.setFeatureState(
                { source: 'composite', sourceLayer: 'country_boundaries', id: hoveredStateId },
                { hover: false }
              );
            }
            hoveredStateId = null;
            map.current.getCanvas().style.cursor = '';
          });
        });
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initMap();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#000005] overflow-hidden" data-testid="globe-container">
      {/* Globe halo effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(20, 35, 60, 0.4) 0%, rgba(20, 35, 60, 0.2) 40%, transparent 60%)',
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
          background: 'radial-gradient(circle at 50% 50%, rgba(140, 163, 184, 0.1) 0%, transparent 70%)',
          animation: 'shimmer 8s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  );
}
