import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Scope } from "./countries";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 500;

export type MapShape = {
  id: string;
  d: string;
  /** Projected centroid, used to draw a dot for tiny countries. */
  cx: number;
  cy: number;
  tiny: boolean;
};

export type Bounds = [[number, number], [number, number]];

/** One polygon of a country, projected, for finding the nearest coast to a tap in the sea. */
type Part = { id: string; x0: number; y0: number; x1: number; y1: number; pts: Float32Array };

export type WorldGeo = {
  shapes: MapShape[];
  parts: Part[];
  project: (lngLat: [number, number]) => [number, number];
};

/** Rough lon/lat boxes for zooming to a continent (Natural Earth country shapes include far-off territories). */
const SCOPE_BOXES: Record<Exclude<Scope, "World">, [[number, number], [number, number]]> = {
  Africa: [[-20, 38], [55, -36]],
  Americas: [[-170, 75], [-30, -56]],
  Asia: [[25, 56], [150, -11]],
  Europe: [[-25, 71], [45, 34]],
  Oceania: [[110, 5], [180, -48]],
};

let geoPromise: Promise<WorldGeo> | null = null;

/** Lazily loads the world map and turns it into SVG path strings (once per session). */
export function loadWorld() {
  geoPromise ??= import("world-atlas/countries-50m.json").then((mod) => {
    const topo = (mod.default ?? mod) as unknown as Topology<{ countries: GeometryCollection }>;
    const fc = feature(topo, topo.objects.countries);
    const features = fc.features.filter(
      (f) => f.id !== "010", // Antarctica takes space and isn't quizzed
    ) as Feature<Geometry, { name: string }>[];
    const projection = geoNaturalEarth1().fitExtent(
      [
        [4, 4],
        [MAP_WIDTH - 4, MAP_HEIGHT - 4],
      ],
      { type: "FeatureCollection", features },
    );
    const path = geoPath(projection);
    const parts: Part[] = [];
    for (const f of features) {
      const id = (f.id as string | undefined) ?? (f.properties?.name === "Kosovo" ? "XK" : undefined);
      const g = f.geometry;
      if (!id || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
      const polygons = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
      for (const poly of polygons) {
        const ring = poly[0];
        const pts = new Float32Array(ring.length * 2);
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        ring.forEach(([lng, lat], i) => {
          const [x, y] = projection([lng, lat]) ?? [NaN, NaN];
          pts[i * 2] = x;
          pts[i * 2 + 1] = y;
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        });
        parts.push({ id, x0, y0, x1, y1, pts });
      }
    }
    const shapes = features.flatMap((f) => {
      const id = (f.id as string | undefined) ?? (f.properties?.name === "Kosovo" ? "XK" : undefined);
      const d = path(f);
      if (!id || !d) return [];
      const [cx, cy] = path.centroid(f);
      return [{ id, d, cx, cy, tiny: path.area(f) < 12 }];
    });
    return { shapes, parts, project: (p: [number, number]) => projection(p) as [number, number] };
  });
  return geoPromise;
}

export function scopeBounds(world: WorldGeo, scope: Scope): Bounds {
  if (scope === "World")
    return [
      [0, 0],
      [MAP_WIDTH, MAP_HEIGHT],
    ];
  const [a, b] = SCOPE_BOXES[scope];
  return [world.project(a), world.project(b)];
}

/** Bounds around a country's center, for zooming in on an answer. */
export function pointBounds(world: WorldGeo, latlng: [number, number], spanDeg: number): Bounds {
  const [lat, lng] = latlng;
  return [world.project([lng - spanDeg, lat + spanDeg / 2]), world.project([lng + spanDeg, lat - spanDeg / 2])];
}

/**
 * The country whose coastline is closest to a point in the sea, if it's within `tolerance`
 * (map units). Lets a tap just off a coast or tiny island still count.
 */
export function nearestCountry(world: WorldGeo, x: number, y: number, tolerance: number): string | null {
  let best = tolerance;
  let bestId: string | null = null;
  for (const p of world.parts) {
    if (x < p.x0 - best || x > p.x1 + best || y < p.y0 - best || y > p.y1 + best) continue;
    const pts = p.pts;
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const ax = pts[i], ay = pts[i + 1], bx = pts[i + 2], by = pts[i + 3];
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      // Skip NaNs and the long jumps where a polygon wraps around the edge of the map.
      if (!(len2 < 6400)) continue;
      const t = len2 ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2)) : 0;
      const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
      if (d < best) {
        best = d;
        bestId = p.id;
      }
    }
  }
  return bestId;
}
