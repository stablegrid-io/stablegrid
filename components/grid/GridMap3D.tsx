'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ComponentSlug } from '@/types/grid';
import {
  DISTRICTS,
  DISTRICT_BY_SLUG,
  LT_BOUNDS,
  type DistrictGeo,
} from '@/lib/grid/districts';
import { GRID_COMPONENTS_BY_SLUG } from '@/lib/grid/components';
import lithuaniaFc from '@/lib/grid/data/lithuania.json';
import { categoryShapeMarkup } from './shapes';
import { CATEGORY_COLOR, INK, PAPER_DIM } from './tokens';

const MASK_SRC = 'lithuania-mask';
const MASK_LAYER = 'lithuania-mask-fill';
const BORDER_SRC = 'lithuania-border';
const BORDER_LAYER = 'lithuania-border-line';

/** Everything-except-Lithuania polygon: world rectangle with LT rings as holes. */
const MASK_GEOJSON: GeoJSON.Feature = (() => {
  const worldRing: GeoJSON.Position[] = [
    [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
  ];
  const innerRings: GeoJSON.Position[][] = [];
  for (const f of (lithuaniaFc as unknown as GeoJSON.FeatureCollection).features) {
    const g = f.geometry;
    if (g.type === 'Polygon') {
      innerRings.push([...g.coordinates[0]].reverse());
    } else if (g.type === 'MultiPolygon') {
      for (const poly of g.coordinates) innerRings.push([...poly[0]].reverse());
    }
  }
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [worldRing, ...innerRings] },
  };
})();

interface GridMap3DProps {
  deployedSlugs: readonly ComponentSlug[];
  focusedSlug?: ComponentSlug | null;
  onMarkerClick?: (slug: ComponentSlug) => void;
}

interface HoverState {
  slug: ComponentSlug;
  x: number;
  y: number;
}

const TOOLTIP_W = 260;
const TOOLTIP_H = 230; // approximate, tall enough for worst-case copy
const TOOLTIP_MARGIN = 12;

export function GridMap3D({ deployedSlugs, focusedSlug, onMarkerClick }: GridMap3DProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<Map<ComponentSlug, { root: HTMLDivElement; marker: maplibregl.Marker }>>(new Map());
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  const deployed = useMemo(() => new Set(deployedSlugs), [deployedSlugs]);

  const updateHoverPosition = useCallback((slug: ComponentSlug) => {
    const map = mapRef.current;
    if (!map) return;
    const d = DISTRICT_BY_SLUG[slug];
    const p = map.project(d.lonLat);
    setHover({ slug, x: p.x, y: p.y });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      bounds: LT_BOUNDS,
      fitBoundsOptions: { padding: 48, pitch: 15, bearing: -6 },
      attributionControl: { compact: true },
      cooperativeGestures: false,
      dragRotate: true,
      pitchWithRotate: true,
      maxPitch: 70,
      minZoom: 5.5,
      maxZoom: 10.5,
    });

    mapRef.current = map;
    map.on('load', () => setStyleLoaded(true));

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      setStyleLoaded(false);
    };
  }, []);

  // Install sources + layers + markers after style loads
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    // ── Lithuania mask + border (everything outside LT painted dark) ──
    if (!map.getSource(MASK_SRC)) {
      map.addSource(MASK_SRC, { type: 'geojson', data: MASK_GEOJSON });
      map.addLayer({
        id: MASK_LAYER,
        type: 'fill',
        source: MASK_SRC,
        paint: {
          'fill-color': PAPER_DIM,
          'fill-opacity': 0.85
        }
      });
    }
    if (!map.getSource(BORDER_SRC)) {
      map.addSource(BORDER_SRC, {
        type: 'geojson',
        data: lithuaniaFc as unknown as GeoJSON.FeatureCollection
      });
      map.addLayer({
        id: BORDER_LAYER,
        type: 'line',
        source: BORDER_SRC,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': INK,
          'line-width': 1.2,
          'line-opacity': 0.6
        }
      });
    }

    // ── Marker shapes (HTML) ──
    for (const d of DISTRICTS) {
      if (markersRef.current.has(d.slug)) continue;
      const root = document.createElement('div');
      root.dataset.slug = d.slug;
      root.dataset.category = d.category;
      root.style.setProperty('--cat', CATEGORY_COLOR[d.category]);
      root.className = 'grid3d-marker';

      const tile = document.createElement('div');
      tile.className = 'grid3d-marker-tile';
      tile.innerHTML = categoryShapeMarkup(d.category);
      const label = document.createElement('div');
      label.className = 'grid3d-marker-label';
      label.textContent = d.label;

      root.appendChild(tile);
      root.appendChild(label);

      root.setAttribute('tabindex', '0');
      root.setAttribute('role', 'button');
      root.setAttribute('aria-label', `${d.name} — ${d.category} component`);

      root.addEventListener('mouseenter', () => updateHoverPosition(d.slug));
      root.addEventListener('mouseleave', () => setHover((prev) => (prev?.slug === d.slug ? null : prev)));
      root.addEventListener('focus', () => updateHoverPosition(d.slug));
      root.addEventListener('blur', () => setHover((prev) => (prev?.slug === d.slug ? null : prev)));
      root.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClickRef.current?.(d.slug);
      });
      root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onMarkerClickRef.current?.(d.slug);
        } else if (e.key === 'Escape') {
          setHover(null);
          root.blur();
        }
      });

      const marker = new maplibregl.Marker({ element: root, anchor: 'center' })
        .setLngLat(d.lonLat)
        .addTo(map);

      markersRef.current.set(d.slug, { root, marker });
    }

    // Keep hover tooltip anchored during camera movement
    const reproject = () => {
      setHover((prev) => {
        if (!prev) return prev;
        const d = DISTRICT_BY_SLUG[prev.slug];
        const p = map.project(d.lonLat);
        return { slug: prev.slug, x: p.x, y: p.y };
      });
    };
    map.on('move', reproject);
    return () => {
      map.off('move', reproject);
    };
  }, [styleLoaded, updateHoverPosition]);

  // Sync deployed state to markers + connection features, with one-shot
  // deploy-moment animation on newly-activated pins and connections.
  const prevDeployedRef = useRef<Set<ComponentSlug>>(new Set());
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded) return;

    const prev = prevDeployedRef.current;
    const newlyDeployed = [...deployed].filter((slug) => !prev.has(slug));

    markersRef.current.forEach((entry, slug) => {
      entry.root.classList.toggle('is-deployed', deployed.has(slug));
    });

    // Pin flash: brief scale + glow burst on each newly deployed marker
    newlyDeployed.forEach((slug) => {
      const entry = markersRef.current.get(slug);
      if (!entry) return;
      entry.root.classList.add('is-just-deployed');
      window.setTimeout(() => entry.root.classList.remove('is-just-deployed'), 900);
    });

    prevDeployedRef.current = new Set(deployed);
  }, [deployed, styleLoaded]);

  // Hovering a shop card → ease the camera toward that district.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoaded || !focusedSlug) return;
    const d = DISTRICT_BY_SLUG[focusedSlug];
    map.easeTo({
      center: d.lonLat,
      zoom: Math.max(map.getZoom(), 7.4),
      pitch: 20,
      duration: 700,
      essential: true,
    });
  }, [focusedSlug, styleLoaded]);

  const hoveredDistrict: DistrictGeo | null = hover ? DISTRICT_BY_SLUG[hover.slug] : null;
  const hoveredComponent = hoveredDistrict ? GRID_COMPONENTS_BY_SLUG[hoveredDistrict.slug] : null;
  const hoveredDeployed = hoveredDistrict ? deployed.has(hoveredDistrict.slug) : false;

  return (
    <figure className="m-0 p-0 bg-surface border border-on-surface overflow-hidden relative">
      <div
        ref={mapContainerRef}
        className="w-full bg-surface-container-low"
        style={{ height: 'clamp(422px, 64vh, 672px)' }}
      />

      {/* Top-left location chip */}
      <div className="absolute top-3.5 left-3.5 font-data-mono uppercase text-[11px] tracking-wider text-on-surface bg-surface border border-on-surface px-3 py-1.5 pointer-events-none">
        Saulėgrid Territory · Lithuania
      </div>

      {/* Category legend */}
      <div className="absolute bottom-3.5 left-3.5 bg-surface border border-on-surface px-3 py-2.5 pointer-events-none grid grid-cols-2 gap-x-4 gap-y-1.5">
        <div className="col-span-2 font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mb-0.5">
          Categories
        </div>
        {(
          [
            ['backbone', 'Backbone'],
            ['protection', 'Protection'],
            ['storage', 'Storage'],
            ['balancing', 'Balancing'],
            ['generation', 'Generation'],
            ['command', 'Command']
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid3d-legend-shape inline-flex flex-shrink-0"
              style={{ width: 14, height: 14, color: CATEGORY_COLOR[key] }}
              dangerouslySetInnerHTML={{ __html: categoryShapeMarkup(key) }}
            />
            <span className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && hoveredDistrict && hoveredComponent && (
        <HoverCardPositioned
          mapEl={mapContainerRef.current}
          x={hover.x}
          y={hover.y}
          district={hoveredDistrict}
          componentName={hoveredComponent.name}
          componentCategory={hoveredComponent.category}
          costKwh={hoveredComponent.costKwh}
          flavor={hoveredComponent.flavor}
          deployed={hoveredDeployed}
        />
      )}

      <style jsx global>{`
        .grid3d-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          pointer-events: auto;
          color: var(--cat);
          transform: translateY(-2px);
        }
        .grid3d-marker-tile {
          width: 30px;
          height: 30px;
          display: block;
          transition: transform 220ms cubic-bezier(.16,1,.3,1);
        }
        .grid3d-shape {
          width: 100%;
          height: 100%;
          display: block;
          color: #8d7167; /* outline (warm taupe) — undeployed pins read as ghost markers */
          transition: color 300ms ease;
        }
        .grid3d-shape-fill {
          opacity: 0;
          transition: opacity 400ms ease;
        }

        .grid3d-legend-shape .grid3d-shape { color: currentColor; }
        .grid3d-legend-shape .grid3d-shape-fill { opacity: 0.9; }

        .grid3d-marker-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          font-weight: 600;
          color: #e1bfb4; /* on-surface-variant (dark) */
          text-transform: uppercase;
          font-family: var(--font-jetbrains-mono), JetBrains Mono, ui-monospace, monospace;
          padding: 2px 6px;
          background: #14140f; /* surface (dark) */
          border: 1px solid #36352f; /* surface-variant */
          white-space: nowrap;
          transition: color 300ms ease, background 300ms ease, border-color 300ms ease;
        }

        .grid3d-marker:hover .grid3d-marker-tile,
        .grid3d-marker:focus-visible .grid3d-marker-tile {
          transform: translateY(-1px) scale(1.1);
        }
        .grid3d-marker:hover .grid3d-shape,
        .grid3d-marker:focus-visible .grid3d-shape {
          color: var(--cat);
        }
        .grid3d-marker:hover .grid3d-marker-label,
        .grid3d-marker:focus-visible .grid3d-marker-label {
          color: #e6e2d9; /* on-surface (dark) */
          border-color: #e6e2d9;
        }
        .grid3d-marker:focus { outline: none; }

        /* Deployed */
        .grid3d-marker.is-deployed .grid3d-shape { color: var(--cat); }
        .grid3d-marker.is-deployed .grid3d-shape-fill { opacity: 0.92; }
        .grid3d-marker.is-deployed .grid3d-marker-tile {
          transform: translateY(-1px) scale(1.06);
        }
        .grid3d-marker.is-deployed .grid3d-marker-label {
          color: #e6e2d9;
          background: #14140f;
          border-color: #e6e2d9;
        }

        /* Deploy-moment burst — scale only, no glow */
        .grid3d-marker.is-just-deployed .grid3d-marker-tile {
          animation: grid3d-pin-burst 900ms cubic-bezier(.16,1,.3,1);
        }
        @keyframes grid3d-pin-burst {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.34); }
          100% { transform: translateY(-1px) scale(1.06); }
        }

        @media (prefers-reduced-motion: reduce) {
          .grid3d-marker-tile,
          .grid3d-shape,
          .grid3d-shape-fill,
          .grid3d-marker-label { transition: none !important; animation: none !important; }
        }

        .maplibregl-ctrl-attrib {
          background: rgba(20, 20, 15, 0.85) !important;
          color: #e1bfb4 !important;
          font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
          font-size: 9px !important;
        }
        .maplibregl-ctrl-attrib a { color: #e6e2d9 !important; }
      `}</style>
    </figure>
  );
}

interface HoverCardProps {
  x: number;
  y: number;
  district: DistrictGeo;
  componentName: string;
  componentCategory: keyof typeof CATEGORY_COLOR;
  costKwh: number;
  flavor: string;
  deployed: boolean;
  mapEl: HTMLDivElement | null;
}

/**
 * Decides whether to render the tooltip above or below the pin, and clamps
 * its horizontal position so it never clips the map container's edges.
 */
function HoverCardPositioned(props: HoverCardProps) {
  const { x, y, mapEl } = props;

  let placement: 'above' | 'below' = 'above';
  let offsetX = 0;

  if (mapEl) {
    const w = mapEl.clientWidth;
    const h = mapEl.clientHeight;

    // Prefer above; flip below if not enough headroom
    if (y < TOOLTIP_H + 20) placement = 'below';
    // If there's also no room below (tiny viewport), stick with whichever is bigger
    if (placement === 'below' && h - y < TOOLTIP_H + 20 && y > h - y) placement = 'above';

    // Horizontal clamp: keep tooltip fully inside container
    const half = TOOLTIP_W / 2;
    const minX = half + TOOLTIP_MARGIN;
    const maxX = w - half - TOOLTIP_MARGIN;
    if (x < minX) offsetX = minX - x;
    else if (x > maxX) offsetX = maxX - x;
  }

  return <HoverCard {...props} placement={placement} offsetX={offsetX} />;
}

interface HoverCardRenderProps extends HoverCardProps {
  placement: 'above' | 'below';
  offsetX: number;
}

function HoverCard({
  x,
  y,
  district,
  componentName,
  componentCategory,
  costKwh,
  flavor,
  deployed,
  placement,
  offsetX
}: HoverCardRenderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = CATEGORY_COLOR[componentCategory];
  const imageSrc = `/grid/components/${district.slug}.jpg`;
  const above = placement === 'above';
  const verticalTransform = above
    ? `translate(calc(-50% + ${offsetX}px), calc(-100% - 22px))`
    : `translate(calc(-50% + ${offsetX}px), 22px)`;

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: x,
        top: y,
        transform: verticalTransform,
        animation: above
          ? 'grid3d-tooltip-in-above 180ms cubic-bezier(.16,1,.3,1)'
          : 'grid3d-tooltip-in-below 180ms cubic-bezier(.16,1,.3,1)'
      }}
    >
      <div
        className="bg-surface border overflow-hidden"
        style={{
          width: 260,
          borderColor: deployed ? color : '#e6e2d9'
        }}
      >
        <div className="relative w-full h-[130px] flex items-center justify-center overflow-hidden bg-surface-container-low">
          {!imageFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              onError={() => setImageFailed(true)}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'saturate(0.6) contrast(0.95)' }}
            />
          )}
          {imageFailed && (
            <div className="font-data-mono uppercase text-[11px] tracking-wider text-on-surface-variant text-center">
              <div className="opacity-50 mb-1">Image Unassigned</div>
              <div className="text-on-surface">{componentCategory.toUpperCase()}</div>
            </div>
          )}

          {/* Status pill */}
          <div
            className="absolute top-2 right-2 font-data-mono uppercase text-[9px] tracking-wider px-2 py-0.5 bg-surface border"
            style={{
              color: deployed ? color : '#594139',
              borderColor: deployed ? color : '#dddad1'
            }}
          >
            {deployed ? '● Online' : 'Offline'}
          </div>
        </div>

        <div className="px-3.5 pt-3 pb-3.5">
          <div className="font-data-mono uppercase text-[10px] tracking-wider text-on-surface-variant mb-1">
            {district.label} · {componentCategory}
          </div>
          <div className="font-serif text-[15px] text-on-surface leading-snug mb-1.5">
            {componentName}
          </div>
          <p className="font-body text-[12px] leading-relaxed text-on-surface-variant m-0 mb-2.5">
            {flavor}
          </p>
          <div className="flex justify-between font-data-mono uppercase tabular-nums text-[10px] tracking-wider text-on-surface-variant pt-2 border-t border-surface-dim">
            <span>Cost</span>
            <span className="text-on-surface">{costKwh.toLocaleString()} kWh</span>
          </div>
        </div>

        {/* Caret */}
        <div
          className="absolute bg-surface"
          style={{
            left: `calc(50% - ${offsetX}px)`,
            [above ? 'bottom' : 'top']: -6,
            width: 12,
            height: 12,
            transform: 'translateX(-50%) rotate(45deg)',
            borderRight: above
              ? `1px solid ${deployed ? color : '#e6e2d9'}`
              : undefined,
            borderBottom: above
              ? `1px solid ${deployed ? color : '#e6e2d9'}`
              : undefined,
            borderLeft: !above
              ? `1px solid ${deployed ? color : '#e6e2d9'}`
              : undefined,
            borderTop: !above
              ? `1px solid ${deployed ? color : '#e6e2d9'}`
              : undefined
          }}
        />
      </div>

      <style jsx>{`
        @keyframes grid3d-tooltip-in-above {
          from { opacity: 0; transform: translate(calc(-50% + ${offsetX}px), calc(-100% - 14px)); }
          to   { opacity: 1; transform: translate(calc(-50% + ${offsetX}px), calc(-100% - 22px)); }
        }
        @keyframes grid3d-tooltip-in-below {
          from { opacity: 0; transform: translate(calc(-50% + ${offsetX}px), 14px); }
          to   { opacity: 1; transform: translate(calc(-50% + ${offsetX}px), 22px); }
        }
      `}</style>
    </div>
  );
}
