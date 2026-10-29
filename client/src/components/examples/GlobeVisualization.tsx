import GlobeVisualization from '../GlobeVisualization';
import { bundledGlobeData, toRouteData } from '@/lib/globeData';

export default function GlobeVisualizationExample() {
  const routes = toRouteData(bundledGlobeData);
  return <GlobeVisualization routes={routes} />;
}
