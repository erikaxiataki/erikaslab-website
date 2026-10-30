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

export type WorldGeo = {
  shapes: MapShape[];
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
    const shapes = features.flatMap((f) => {
      const id = (f.id as string | undefined) ?? (f.properties?.name === "Kosovo" ? "XK" : undefined);
      const d = path(f);
      if (!id || !d) return [];
      const [cx, cy] = path.centroid(f);
      return [{ id, d, cx, cy, tiny: path.area(f) < 12 }];
    });
    return { shapes, project: (p: [number, number]) => projection(p) as [number, number] };
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
