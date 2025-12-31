import { useState } from 'react';

export default function GlobeVisualization({ routes = [] }) {
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const getUniqueLocations = () => {
    const locations = new Map();
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

  const projectCoords = (lon, lat) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x, y };
  };

  const createArcPath = (from, to) => {
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

  const handleRouteHover = (route, event) => {
    setHoveredRoute(route);
    if (event) {
      setMousePos({ x: event.clientX, y: event.clientY });
    }
  };

  const originLocations = getUniqueLocations();
  const meetupLocations = getMeetupLocations();

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden" data-testid="globe-container">
      {/* Background gradient */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-cyan-500/10" />
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

        {/* Route paths */}
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
            
            {/* Animated dash line */}
            <path
              d={createArcPath(route.coords[0], route.coords[1])}
              fill="none"
              stroke={route.color[0]}
              strokeWidth="0.15"
              strokeLinecap="round"
              style={{
                opacity: 0.6,
                strokeDasharray: '2, 4',
                animation: 'route-flow 4s linear infinite',
              }}
            />
          </g>
        ))}

        {/* Origin dots */}
        {originLocations.map((loc, idx) => {
          const pos = projectCoords(loc.coords[0], loc.coords[1]);
          return (
            <circle
              key={idx}
              cx={pos.x}
              cy={pos.y}
              r="0.4"
              fill={loc.color}
              style={{
                filter: `drop-shadow(0 0 1px ${loc.color}) drop-shadow(0 0 2px ${loc.color})`,
                animation: 'pulse-glow 2s ease-in-out infinite',
              }}
              data-testid={`origin-dot-${idx}`}
            />
          );
        })}
      </svg>

      {/* Meetup heart icons */}
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
            <div className="relative" data-testid={`meetup-icon-${idx}`} style={{ animation: 'shimmer 3s ease-in-out infinite' }}>
              <div className="w-6 h-6 flex items-center justify-center rounded-md bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30">
                <div className="w-3.5 h-3.5 text-yellow-500" style={{ filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.6))' }}>
                  ❤️
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Tooltip */}
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

      {/* Title overlay */}
      <div className="absolute bottom-8 left-8 pointer-events-none" data-testid="title-overlay">
        <h1 className="text-3xl font-serif text-white/25 tracking-[0.2em] select-none">
          Love Letters
        </h1>
      </div>

      {/* Instructions */}
      <div className="absolute top-6 right-6 text-white/20 text-sm font-light pointer-events-none">
        <p className="tracking-wider">Hover routes to reveal dates</p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes route-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 6; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}