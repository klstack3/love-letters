import type { RouteData } from "@/components/GlobeVisualization";
import rawGlobeData from "@/data/routes.json";

export type LngLat = [number, number];

export interface SimpleRoute {
  from: string;
  to: string;
  date: string;
  person: string;
  meetup?: boolean;
}

export interface Person {
  colors: [string, string];
}

export interface GlobeData {
  routes: SimpleRoute[];
  people: Record<string, Person>;
  places: Record<string, LngLat>;
}

export const bundledGlobeData = rawGlobeData as unknown as GlobeData;

const FALLBACK_COLORS: [string, string] = ["#8b5cf6", "#a855f7"];

export function findMissingPlaces(data: GlobeData): string[] {
  const missing = new Set<string>();
  for (const route of data.routes) {
    if (!data.places[route.from]) missing.add(route.from);
    if (!data.places[route.to]) missing.add(route.to);
  }
  return Array.from(missing);
}

/** Routes whose places are unknown are skipped rather than drawn at 0,0. */
export function toRouteData(data: GlobeData): RouteData[] {
  return data.routes.flatMap((route) => {
    const fromCoords = data.places[route.from];
    const toCoords = data.places[route.to];
    if (!fromCoords || !toCoords) return [];

    return [
      {
        from: route.from,
        to: route.to,
        coords: [fromCoords, toCoords],
        color: data.people[route.person]?.colors ?? FALLBACK_COLORS,
        date: route.date,
        person: route.person,
        meetup: !!route.meetup,
      },
    ];
  });
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "June 2025" -> "2025-06" (for <input type="month">); "" if unparseable. */
export function dateToMonthInput(date: string): string {
  const match = date.trim().match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return "";
  const monthIndex = MONTHS.findIndex(
    (m) => m.toLowerCase() === match[1].toLowerCase()
  );
  if (monthIndex === -1) return "";
  return `${match[2]}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/** "2025-06" -> "June 2025" */
export function monthInputToDate(value: string): string {
  const [year, month] = value.split("-");
  const name = MONTHS[Number(month) - 1];
  return name && year ? `${name} ${year}` : value;
}

/** Sort key so "June 2025" orders chronologically; unparseable dates sort last. */
export function dateSortKey(date: string): string {
  return dateToMonthInput(date) || "9999-99";
}
