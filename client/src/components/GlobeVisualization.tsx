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

    mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
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

      map.current.setFog({
        color: 'rgb(15, 20, 35)',
        'high-color': 'rgb(25, 35, 60)',
        'horizon-blend': 0.03,
        'space-color': 'rgb(5, 8, 15)',
        'star-intensity': 0.8
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
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#050810] overflow-hidden" data-testid="globe-container">
      <div ref={mapContainer} className="absolute inset-0" />

      <div className="absolute bottom-8 left-8 pointer-events-none z-10" data-testid="title-overlay">
        <h1 className="text-3xl font-serif text-white/25 tracking-[0.2em] select-none">
          Love Letters
        </h1>
      </div>
    </div>
  );
}
