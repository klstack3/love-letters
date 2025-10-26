import { useState } from 'react';
import { Heart } from 'lucide-react';

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
  const [hoveredRoute, setHoveredRoute] = useState<RouteData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getUniqueLocations = () => {
    const locations = new Map<string, { coords: [number, number]; color: string; name: string }>();
    
    routes.forEach(route => {
      const fromKey = `${route.coords[0][0]},${route.coords[0][1]}`;
      const toKey = `${route.coords[1][0]},${route.coords[1][1]}`;
      
      if (!locations.has(fromKey)) {
        locations.set(fromKey, { coords: route.coords[0], color: route.color[0], name: route.from });
      }
      if (!locations.has(toKey)) {
        locations.set(toKey, { coords: route.coords[1], color: route.color[1], name: route.to });
      }
    });
    
    return Array.from(locations.values());
  };

  const getMeetupLocations = () => {
    return routes
      .filter(route => route.meetup)
      .map(route => ({ coords: route.coords[1], date: route.date, to: route.to }));
  };

  const projectCoords = (lon: number, lat: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const createArcPath = (from: [number, number], to: [number, number]) => {
    const start = projectCoords(from[0], from[1]);
    const end = projectCoords(to[0], to[1]);
    
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    
    const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const controlOffset = distance * 0.3;
    
    const controlX = midX;
    const controlY = midY - controlOffset;
    
    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
  };

  const handleRouteHover = (route: RouteData | null, event?: React.MouseEvent) => {
    setHoveredRoute(route);
    if (event) {
      setMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const originLocations = getUniqueLocations();
  const meetupLocations = getMeetupLocations();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" data-testid="globe-container">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet/10 via-transparent to-cyan/10" />
      </div>

      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          {routes.map((route, idx) => (
            <linearGradient key={`gradient-${idx}`} id={`gradient-${idx}`} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={route.color[0]} stopOpacity="0.9" />
              <stop offset="100%" stopColor={route.color[1]} stopOpacity="0.9" />
            </linearGradient>
          ))}
        </defs>

        {routes.map((route, idx) => (
          <g key={idx}>
            <path
              d={createArcPath(route.coords[0], route.coords[1])}
              fill="none"
              stroke={`url(#gradient-${idx})`}
              strokeWidth="0.3"
              strokeLinecap="round"
              className="transition-all duration-300"
              style={{
                filter: hoveredRoute === route 
                  ? `drop-shadow(0 0 3px ${route.color[0]}) drop-shadow(0 0 6px ${route.color[1]})` 
                  : `drop-shadow(0 0 1px ${route.color[0]}) drop-shadow(0 0 2px ${route.color[1]})`,
                opacity: hoveredRoute && hoveredRoute !== route ? 0.4 : 1,
              }}
              onMouseEnter={(e) => handleRouteHover(route, e)}
              onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => handleRouteHover(null)}
              data-testid={`route-arc-${idx}`}
            />
            
            <path
              d={createArcPath(route.coords[0], route.coords[1])}
              fill="none"
              stroke={route.color[0]}
              strokeWidth="0.15"
              strokeLinecap="round"
              className="animate-gradient-shift"
              style={{
                opacity: 0.6,
                strokeDasharray: '2, 4',
                animation: 'gradient-shift 4s linear infinite',
              }}
            />
          </g>
        ))}

        {originLocations.map((loc, idx) => {
          const pos = projectCoords(loc.coords[0], loc.coords[1]);
          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r="0.4"
              fill={loc.color}
              className="animate-pulse-glow"
              style={{
                filter: `drop-shadow(0 0 1px ${loc.color}) drop-shadow(0 0 2px ${loc.color})`,
              }}
              data-testid={`origin-dot-${idx}`}
            />
          );
        })}
      </svg>

      {meetupLocations.map((loc, idx) => {
        const pos = projectCoords(loc.coords[0], loc.coords[1]);
        return (
          <div
            key={idx}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
            }}
          >
            <div className="relative animate-shimmer" data-testid={`meetup-icon-${idx}`}>
              <div className="w-6 h-6 flex items-center justify-center rounded-md bg-golden/20 backdrop-blur-sm border border-golden/30">
                <Heart className="w-3.5 h-3.5 text-golden fill-golden drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]" />
              </div>
            </div>
          </div>
        );
      })}

      {hoveredRoute && (
        <div
          className="fixed pointer-events-none z-50 px-4 py-2.5 bg-black/90 backdrop-blur-md border border-white/20 rounded-md shadow-xl"
          style={{
            left: mousePos.x + 15,
            top: mousePos.y + 15,
          }}
          data-testid="route-tooltip"
        >
          <p className="text-sm text-white/95 font-medium">
            {hoveredRoute.from} → {hoveredRoute.to}
          </p>
          <p className="text-xs text-white/70 mt-1">
            {new Date(hoveredRoute.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      )}

      <div className="absolute bottom-8 left-8 pointer-events-none" data-testid="title-overlay">
        <h1 className="text-3xl font-serif text-white/25 tracking-[0.2em] select-none">
          Love Letters
        </h1>
      </div>

      <div className="absolute top-6 right-6 text-white/20 text-sm font-light pointer-events-none">
        <p className="tracking-wider">Hover routes to reveal dates</p>
      </div>
    </div>
  );
}
