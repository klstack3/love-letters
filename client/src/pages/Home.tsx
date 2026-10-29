import GlobeVisualization from '@/components/GlobeVisualization';
import { useGlobeRoutes } from '@/hooks/use-globe-routes';
import { bundledGlobeData } from '@/lib/globeData';

export default function Home() {
  const routes = useGlobeRoutes(bundledGlobeData);

  return (
    <div className="w-full h-screen bg-black" data-testid="home-page">
      <GlobeVisualization routes={routes} />
    </div>
  );
}
