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
import { CATEGORY_COLOR, PANEL_BG, PANEL_BORDER, TEXT_TERTIARY } from './tokens';

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
  for (const f of (lithuaniaFc as GeoJSON.FeatureCollection).features) {
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
}

interface HoverState {
  slug: ComponentSlug;
  x: number;
  y: number;
}

const TOOLTIP_W = 260;
const TOOLTIP_H = 230; // approximate, tall enough for worst-case copy
const TOOLTIP_MARGIN = 12;

export function GridMap3D({ deployedSlugs, focusedSlug }: GridMap3DProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markersRef = useRef<Map<ComponentSlug, { root: HTMLDivElement; marker: maplibregl.Marker }>>(new Map());
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [hover, setHover] = useState<HoverState | null>(null);

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
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
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
          'fill-color': '#06080a',
          'fill-opacity': 0.94,
        },
      });
    }
    if (!map.getSource(BORDER_SRC)) {
      map.addSource(BORDER_SRC, { type: 'geojson', data: lithuaniaFc as GeoJSON.FeatureCollection });
      // Soft outer glow
      map.addLayer({
        id: `${BORDER_LAYER}-glow`,
        type: 'line',
        source: BORDER_SRC,
        paint: {
          'line-color': '#99f7ff',
          'line-width': 5,
          'line-blur': 6,
          'line-opacity': 0.22,
        },
      });
      map.addLayer({
        id: BORDER_LAYER,
        type: 'line',
        source: BORDER_SRC,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#99f7ff',
          'line-width': 1.2,
          'line-opacity': 0.55,
        },
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
      root.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          updateHoverPosition(d.slug);
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
    <figure
      style={{
        margin: 0,
        padding: 0,
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: 'clamp(422px, 64vh, 672px)', background: '#06080a' }}
      />

      {/* Legend */}
      <div
        className="font-mono"
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          background: 'rgba(10,12,14,0.72)',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 8,
          backdropFilter: 'blur(8px)',
          fontSize: 10,
          letterSpacing: '0.18em',
          color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        Saulégrid Territory · Lithuania
      </div>

      {/* Category legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 14,
          left: 14,
          padding: '10px 12px 10px 12px',
          background: 'rgba(10,12,14,0.78)',
          border: `1px solid ${PANEL_BORDER}`,
          borderRadius: 10,
          backdropFilter: 'blur(10px)',
          pointerEvents: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, auto)',
          columnGap: 16,
          rowGap: 6,
        }}
      >
        <div
          className="font-mono"
          style={{
            gridColumn: '1 / -1',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          Categories
        </div>
        {(
          [
            ['backbone', 'Backbone'],
            ['protection', 'Protection'],
            ['storage', 'Storage'],
            ['balancing', 'Balancing'],
            ['generation', 'Generation'],
            ['command', 'Command'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              aria-hidden
              className="grid3d-legend-shape"
              style={{
                width: 16,
                height: 16,
                color: CATEGORY_COLOR[key],
                filter: `drop-shadow(0 0 4px ${CATEGORY_COLOR[key]}80)`,
                flexShrink: 0,
                display: 'inline-flex',
              }}
              dangerouslySetInnerHTML={{ __html: categoryShapeMarkup(key) }}
            />
            <span
              className="font-mono"
              style={{ fontSize: 10, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase' }}
            >
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
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.55));
          transition: transform 220ms cubic-bezier(.16,1,.3,1), filter 300ms ease;
        }
        .grid3d-shape {
          width: 100%;
          height: 100%;
          display: block;
          color: rgba(255,255,255,0.42);
          transition: color 300ms ease;
        }
        .grid3d-shape-fill {
          opacity: 0;
          transition: opacity 400ms ease;
        }

        /* Legend uses the same shapes but always filled in the category color */
        .grid3d-legend-shape .grid3d-shape { color: currentColor; }
        .grid3d-legend-shape .grid3d-shape-fill { opacity: 0.9; }
        .grid3d-marker-label {
          font-size: 9px;
          letter-spacing: 0.18em;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.42);
          text-transform: uppercase;
          font-family: var(--font-jetbrains-mono), JetBrains Mono, ui-monospace, monospace;
          padding: 2px 6px;
          border-radius: 3px;
          background: rgba(10, 12, 14, 0.62);
          white-space: nowrap;
          transition: color 300ms ease, background 300ms ease;
        }

        /* Hover + focus */
        .grid3d-marker:hover .grid3d-marker-tile,
        .grid3d-marker:focus-visible .grid3d-marker-tile {
          transform: translateY(-1px) scale(1.1);
          filter: drop-shadow(0 2px 10px color-mix(in oklab, var(--cat) 50%, transparent));
        }
        .grid3d-marker:hover .grid3d-shape,
        .grid3d-marker:focus-visible .grid3d-shape {
          color: var(--cat);
        }
        .grid3d-marker:focus { outline: none; }

        /* Deployed */
        .grid3d-marker.is-deployed .grid3d-shape { color: var(--cat); }
        .grid3d-marker.is-deployed .grid3d-shape-fill { opacity: 0.92; }
        .grid3d-marker.is-deployed .grid3d-marker-tile {
          filter:
            drop-shadow(0 0 8px color-mix(in oklab, var(--cat) 70%, transparent))
            drop-shadow(0 2px 12px rgba(0,0,0,0.6));
          transform: translateY(-1px) scale(1.06);
        }
        .grid3d-marker.is-deployed .grid3d-marker-label {
          color: var(--cat);
          background: rgba(10, 12, 14, 0.82);
        }

        /* Deploy-moment burst */
        .grid3d-marker.is-just-deployed .grid3d-marker-tile {
          animation: grid3d-pin-burst 900ms cubic-bezier(.16,1,.3,1);
        }
        @keyframes grid3d-pin-burst {
          0%   { transform: scale(1); filter: drop-shadow(0 0 0 var(--cat)) drop-shadow(0 2px 6px rgba(0,0,0,0.55)); }
          30%  { transform: scale(1.34); filter: drop-shadow(0 0 20px var(--cat)) drop-shadow(0 2px 6px rgba(0,0,0,0.55)); }
          100% { transform: translateY(-1px) scale(1.06); }
        }

        @media (prefers-reduced-motion: reduce) {
          .grid3d-marker-tile,
          .grid3d-shape,
          .grid3d-shape-fill,
          .grid3d-marker-label { transition: none !important; animation: none !important; }
        }

        .maplibregl-ctrl-attrib {
          background: rgba(10, 12, 14, 0.6) !important;
          color: rgba(255, 255, 255, 0.45) !important;
          font-family: var(--font-jetbrains-mono), ui-monospace, monospace;
          font-size: 9px !important;
        }
        .maplibregl-ctrl-attrib a { color: rgba(255, 255, 255, 0.55) !important; }
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

function HoverCard({ x, y, district, componentName, componentCategory, costKwh, flavor, deployed, placement, offsetX }: HoverCardRenderProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const color = CATEGORY_COLOR[componentCategory];
  const imageSrc = `/grid/components/${district.slug}.jpg`;
  const above = placement === 'above';
  const verticalTransform = above
    ? `translate(calc(-50% + ${offsetX}px), calc(-100% - 22px))`
    : `translate(calc(-50% + ${offsetX}px), 22px)`;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: verticalTransform,
        pointerEvents: 'none',
        zIndex: 20,
        animation: above
          ? 'grid3d-tooltip-in-above 180ms cubic-bezier(.16,1,.3,1)'
          : 'grid3d-tooltip-in-below 180ms cubic-bezier(.16,1,.3,1)',
      }}
    >
      <div
        style={{
          width: 260,
          background: 'rgba(10,12,14,0.94)',
          border: `1px solid ${deployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 130,
            background: `linear-gradient(135deg, ${color}22, rgba(12,14,16,0.9) 65%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {!imageFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt=""
              onError={() => setImageFailed(true)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'saturate(0.85) contrast(1.05)',
              }}
            />
          )}
          {imageFailed && (
            <div
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.2em',
                color: `${color}`,
                textTransform: 'uppercase',
                textAlign: 'center',
                padding: 10,
                lineHeight: 1.6,
              }}
            >
              <div style={{ opacity: 0.45, marginBottom: 4 }}>IMAGE UNASSIGNED</div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', color }}>
                {componentCategory.toUpperCase()}
              </div>
            </div>
          )}

          {/* Gradient fade at bottom for legibility of text below */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 40,
              background: 'linear-gradient(to bottom, transparent, rgba(10,12,14,0.95))',
              pointerEvents: 'none',
            }}
          />

          {/* Status pill */}
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              padding: '3px 8px',
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontWeight: 600,
              color: deployed ? color : 'rgba(255,255,255,0.55)',
              background: 'rgba(10,12,14,0.7)',
              border: `1px solid ${deployed ? `${color}66` : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 4,
            }}
          >
            {deployed ? '● ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div style={{ padding: '12px 14px 14px' }}>
          <div
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: '0.2em',
              color: TEXT_TERTIARY,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            {district.label} · {componentCategory}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#f0f0f3',
              letterSpacing: '-0.005em',
              fontFamily: '-apple-system, "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
              marginBottom: 6,
            }}
          >
            {componentName}
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.5, color: 'rgba(255,255,255,0.62)', margin: '0 0 10px' }}>
            {flavor}
          </p>
          <div
            className="font-mono tabular-nums"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              letterSpacing: '0.12em',
              color: TEXT_TERTIARY,
              textTransform: 'uppercase',
              paddingTop: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span>Cost</span>
            <span style={{ color: deployed ? color : '#f0f0f3' }}>
              {costKwh.toLocaleString()} kWh
            </span>
          </div>
        </div>

        {/* Caret — flips depending on placement */}
        <div
          style={{
            position: 'absolute',
            // Caret tracks the pin: add the horizontal offset back so it points at the pin
            left: `calc(50% - ${offsetX}px)`,
            [above ? 'bottom' : 'top']: -6,
            width: 12,
            height: 12,
            transform: 'translateX(-50%) rotate(45deg)',
            background: 'rgba(10,12,14,0.94)',
            borderRight: above ? `1px solid ${deployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}` : undefined,
            borderBottom: above ? `1px solid ${deployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}` : undefined,
            borderLeft: !above ? `1px solid ${deployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}` : undefined,
            borderTop: !above ? `1px solid ${deployed ? `${color}4d` : 'rgba(255,255,255,0.08)'}` : undefined,
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
