"use client";

import "d3-transition";
import { select } from "d3-selection";
import { type ZoomBehavior, type ZoomTransform, zoom, zoomIdentity } from "d3-zoom";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BY_MAP_ID, type Country, type Scope, inScope } from "@/lib/atlas/countries";
import {
  type Bounds,
  MAP_HEIGHT,
  MAP_WIDTH,
  type MapShape,
  type WorldGeo,
  loadWorld,
  nearestCountry,
  pointBounds,
  scopeBounds,
} from "@/lib/atlas/geo";
import { useI18n } from "@/lib/atlas/i18n";
import { cn } from "@/lib/utils";

export const MAP_COLORS = {
  land: "#3b4a6b",
  dim: "#1f2940",
  correct: "#22c55e",
  wrong: "#ef4444",
  selected: "#facc15",
  mastery: ["#3b4a6b", "#7c3aed", "#6366f1", "#0ea5e9", "#14b8a6", "#22c55e"],
};

type Props = {
  scope?: Scope;
  /** Fill color per country code (overrides the default land color). */
  colors?: Record<string, string>;
  onPick?: (country: Country) => void;
  /** Show the country name on hover (off during Map Hunt, obviously). */
  showNames?: boolean;
  /** Zoom in around a point; falls back to the scope view when null. */
  focus?: MapFocus | null;
  className?: string;
};

function useWorld() {
  const [world, setWorld] = useState<WorldGeo | null>(null);
  useEffect(() => {
    let alive = true;
    loadWorld().then((w) => alive && setWorld(w));
    return () => {
      alive = false;
    };
  }, []);
  return world;
}

const CountryPaths = memo(function CountryPaths({
  shapes,
  fills,
  onPick,
  onHover,
}: {
  shapes: MapShape[];
  fills: Map<string, string>;
  onPick: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  return (
    <g>
      {shapes.map((s) => (
        <path
          key={s.id}
          d={s.d}
          data-id={s.id}
          fill={fills.get(s.id)}
          className="atlas-country"
          onClick={() => onPick(s.id)}
          onMouseEnter={() => onHover(s.id)}
          onMouseLeave={() => onHover(null)}
        />
      ))}
    </g>
  );
});

export type MapFocus = { latlng: [number, number]; span: number };

/** A comfortable zoom around a country, based on its size. */
export function countryFocus(c: Country): MapFocus {
  return { latlng: c.latlng, span: Math.max(12, Math.min(60, Math.sqrt(c.area) / 25)) };
}

/** Taps this close to a coast (in screen pixels) count as tapping that country. */
const SNAP_PX = 18;

/**
 * Map height in viewBox units. The map is wide (960×500), which makes it a thin strip on a
 * portrait phone, so narrow screens get a taller viewport to show regions bigger.
 */
function useMapHeight(ref: React.RefObject<HTMLDivElement | null>) {
  const [h, setH] = useState(MAP_HEIGHT);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const ratio = (0.58 * window.innerHeight) / Math.max(1, el.clientWidth);
      setH(Math.round(MAP_WIDTH * Math.min(1.1, Math.max(MAP_HEIGHT / MAP_WIDTH, ratio))));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return h;
}

export function WorldMap({ scope = "World", colors, onPick, showNames, focus, className }: Props) {
  const world = useWorld();
  const { t, name } = useI18n();
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const h = useMapHeight(boxRef);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [k, setK] = useState(1);
  const [hover, setHover] = useState<string | null>(null);

  const fills = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of world?.shapes ?? []) {
      const c = BY_MAP_ID.get(s.id);
      const override = c && colors?.[c.code];
      m.set(s.id, override ?? (c && inScope(c, scope) ? MAP_COLORS.land : MAP_COLORS.dim));
    }
    return m;
  }, [world, colors, scope]);

  const pick = useCallback(
    (id: string) => {
      const c = BY_MAP_ID.get(id);
      if (c && onPick) onPick(c);
    },
    [onPick],
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !world) return;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 60])
      .translateExtent([
        [-MAP_WIDTH * 0.25, -h * 0.25],
        [MAP_WIDTH * 1.25, h * 1.25],
      ])
      .clickDistance(6)
      .on("zoom", (e) => {
        transformRef.current = e.transform;
        gRef.current?.setAttribute("transform", e.transform.toString());
        setK(e.transform.k);
      });
    zoomRef.current = z;
    select(svg).call(z).on("dblclick.zoom", null);
    return () => {
      select(svg).on(".zoom", null);
    };
  }, [world, h]);

  const fitTo = useCallback(
    (b: Bounds, duration = 700) => {
    const svg = svgRef.current;
    const z = zoomRef.current;
    if (!svg || !z) return;
    const [[x0, y0], [x1, y1]] = b;
    const scale = Math.min(60, 0.92 / Math.max((x1 - x0) / MAP_WIDTH, (y1 - y0) / h));
    const t = zoomIdentity
      .translate(MAP_WIDTH / 2, h / 2)
      .scale(scale)
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    select(svg).transition().duration(duration).call(z.transform, t);
    },
    [h],
  );

  // A tap in the sea just off a coast (or next to a tiny island) counts as that country.
  const pickNearest = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm || !world || !onPick) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const [x, y] = transformRef.current.invert([pt.x, pt.y]);
    const unitsPerPx = MAP_WIDTH / svg.clientWidth / transformRef.current.k;
    const id = nearestCountry(world, x, y, SNAP_PX * unitsPerPx);
    if (id) pick(id);
  };

  const [lat, lng] = focus?.latlng ?? [];
  const span = focus?.span;
  useEffect(() => {
    if (!world) return;
    if (lat !== undefined && lng !== undefined && span) fitTo(pointBounds(world, [lat, lng], span));
    else fitTo(scopeBounds(world, scope));
  }, [world, scope, lat, lng, span, fitTo]);

  const zoomBy = (factor: number) => {
    const svg = svgRef.current;
    if (svg && zoomRef.current) select(svg).transition().duration(250).call(zoomRef.current.scaleBy, factor);
  };

  const hovered = hover ? BY_MAP_ID.get(hover) : null;

  return (
    <div ref={boxRef} className={cn("relative overflow-hidden rounded-2xl bg-[#0a1124] ring-1 ring-white/10", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${h}`}
        className={cn("block h-auto w-full touch-none select-none", (onPick || showNames) && "atlas-interactive")}
        role="img"
        aria-label="World map"
      >
        <defs>
          <radialGradient id="atlas-ocean" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#13234a" />
            <stop offset="100%" stopColor="#0a1124" />
          </radialGradient>
        </defs>
        <rect width={MAP_WIDTH} height={h} fill="url(#atlas-ocean)" onClick={onPick ? pickNearest : undefined} />
        <g ref={gRef}>
          {world && <CountryPaths shapes={world.shapes} fills={fills} onPick={pick} onHover={setHover} />}
          {world?.shapes
            .filter((s) => s.tiny && BY_MAP_ID.has(s.id))
            .map((s) => (
              <g key={s.id} onClick={() => pick(s.id)} onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
                <circle cx={s.cx} cy={s.cy} r={14 / k} fill="transparent" />
                <circle cx={s.cx} cy={s.cy} r={3.2 / k} fill={fills.get(s.id)} stroke="#cbd5e1" strokeWidth={0.6 / k} />
              </g>
            ))}
        </g>
      </svg>
      {!world && (
        <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">
          <span className="animate-pulse">{t("Loading the world… 🌍")}</span>
        </div>
      )}
      {showNames && hovered && (
        <div className="pointer-events-none absolute top-2 left-2 rounded-lg bg-black/70 px-2.5 py-1 text-sm font-semibold text-white">
          {name(hovered)}
        </div>
      )}
      <div className="absolute right-2 bottom-2 flex flex-col gap-1">
        <ZoomButton label={t("Zoom in")} onClick={() => zoomBy(1.8)}>
          <Plus className="size-4" />
        </ZoomButton>
        <ZoomButton label={t("Zoom out")} onClick={() => zoomBy(1 / 1.8)}>
          <Minus className="size-4" />
        </ZoomButton>
        <ZoomButton label={t("Reset view")} onClick={() => world && fitTo(scopeBounds(world, scope))}>
          <RotateCcw className="size-4" />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg bg-slate-800/90 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700"
    >
      {children}
    </button>
  );
}
