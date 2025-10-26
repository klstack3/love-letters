import GlobeVisualization, { type RouteData } from '../GlobeVisualization';
import routesData from '../../data/routes.json';

export default function GlobeVisualizationExample() {
  const routes = routesData as RouteData[];
  return <GlobeVisualization routes={routes} />;
}
