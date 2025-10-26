import GlobeVisualization, { type RouteData } from '@/components/GlobeVisualization';
import routesData from '@/data/routes.json';

export default function Home() {
  const routes = routesData as RouteData[];
  
  return (
    <div className="w-full h-screen bg-black" data-testid="home-page">
      <GlobeVisualization routes={routes} />
    </div>
  );
}
