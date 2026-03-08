'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { GridFlowFocusZone, GridFlowSceneState } from '@/components/home/landing/gridFlowStory';

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

interface Point2D {
  x: number;
  y: number;
}

type Point3D = [number, number, number];

interface IsoBoxFaces {
  top: Point2D[];
  left: Point2D[];
  right: Point2D[];
}

interface DiagramBox {
  id: string;
  stage: number;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}

interface DiagramLabel {
  id: string;
  text: string;
  point: Point3D;
  dx: number;
  dy: number;
}

interface GridFlowSceneCanvasProps {
  currentScene: GridFlowSceneState;
  nextScene: GridFlowSceneState;
  phaseProgress: number;
  reducedMotion: boolean;
}

const PROJECTED_ORIGIN_X = 660;
const PROJECTED_ORIGIN_Y = 486;
const ISO_SCALE_X = 124;
const ISO_SCALE_Y = 60;
const ISO_HEIGHT = 116;

const STATION_BOXES: DiagramBox[] = [
  { id: 'entry-a', stage: 1, x: -2.58, y: 0.82, z: 0, width: 0.28, depth: 0.28, height: 0.86 },
  { id: 'entry-b', stage: 1, x: -2.22, y: 0.48, z: 0, width: 0.28, depth: 0.28, height: 0.86 },
  { id: 'entry-c', stage: 1, x: -2.82, y: 0.3, z: 0, width: 0.22, depth: 0.22, height: 0.64 },
  { id: 'switch-a', stage: 2, x: -1.64, y: 0.44, z: 0, width: 0.42, depth: 0.4, height: 0.78 },
  { id: 'switch-b', stage: 2, x: -1.12, y: 0.14, z: 0, width: 0.42, depth: 0.4, height: 0.78 },
  { id: 'switch-c', stage: 2, x: -0.54, y: -0.14, z: 0, width: 0.42, depth: 0.4, height: 0.78 },
  { id: 'core-a', stage: 3, x: 0.18, y: -0.02, z: 0, width: 0.78, depth: 0.66, height: 0.94 },
  { id: 'core-b', stage: 3, x: 0.92, y: -0.26, z: 0, width: 0.78, depth: 0.66, height: 0.94 },
  { id: 'core-c', stage: 3, x: 0.54, y: 0.52, z: 0, width: 0.48, depth: 0.38, height: 0.6 },
  { id: 'out-a', stage: 4, x: 2.08, y: -0.34, z: 0, width: 0.3, depth: 0.3, height: 0.92 },
  { id: 'out-b', stage: 4, x: 2.48, y: -0.6, z: 0, width: 0.3, depth: 0.3, height: 0.92 },
  { id: 'out-c', stage: 4, x: 1.92, y: 0.18, z: 0, width: 0.24, depth: 0.24, height: 0.68 }
];

const CALLOUTS: DiagramLabel[] = [
  { id: 'callout-entry', text: 'TRACK', point: [-2.62, 1.18, 0.96], dx: -30, dy: -74 },
  { id: 'callout-switch', text: 'MISSION', point: [-1.02, 0.44, 0.88], dx: -20, dy: -86 },
  { id: 'callout-core', text: 'GRID', point: [0.88, 0.16, 1.1], dx: 28, dy: -88 },
  { id: 'callout-output', text: 'HRB', point: [2.42, -0.46, 1.04], dx: 38, dy: -78 }
];

const PRIMARY_ROUTE: Point3D[] = [
  [-3.28, 1.06, 1.04],
  [-2.54, 0.92, 1.04],
  [-2.08, 0.58, 0.9],
  [-1.58, 0.42, 0.9],
  [-1.08, 0.18, 0.9],
  [-0.48, -0.06, 0.9],
  [0.24, -0.02, 1],
  [0.92, -0.14, 1.08],
  [1.56, -0.28, 1],
  [2.28, -0.46, 1.02],
  [3.18, -0.68, 1.02]
];

const LOWER_BUS_ROUTE: Point3D[] = [
  [-2.18, 0.18, 0.58],
  [-1.6, 0.02, 0.58],
  [-0.94, -0.14, 0.58],
  [-0.24, -0.28, 0.58],
  [0.58, -0.42, 0.58],
  [1.38, -0.56, 0.58],
  [2.1, -0.7, 0.58]
];

const UPPER_BUS_ROUTE: Point3D[] = [
  [-2.26, 0.74, 0.74],
  [-1.68, 0.56, 0.74],
  [-1.04, 0.32, 0.74],
  [-0.22, 0.08, 0.74],
  [0.68, -0.06, 0.74],
  [1.48, -0.24, 0.74],
  [2.24, -0.42, 0.74]
];

const TIE_ROUTES: Point3D[][] = [
  [[-1.56, 0.48, 0.84], [-1.56, 0.14, 0.6]],
  [[-1.04, 0.22, 0.84], [-1.04, -0.1, 0.6]],
  [[-0.46, -0.04, 0.84], [-0.46, -0.36, 0.6]],
  [[1.02, -0.14, 0.84], [1.02, -0.48, 0.6]]
];

const PULSE_COUNT = 1;

const FLOOR_BOUNDS = {
  x: -3.5,
  y: -2.3,
  width: 7.2,
  depth: 4.8,
  height: 0.08
};

const projectPoint = ([x, y, z]: Point3D): Point2D => ({
  x: PROJECTED_ORIGIN_X + (x - y) * ISO_SCALE_X,
  y: PROJECTED_ORIGIN_Y + (x + y) * ISO_SCALE_Y - z * ISO_HEIGHT
});

const pointsToString = (points: Point2D[]) => points.map((point) => `${point.x},${point.y}`).join(' ');

const createIsoBox = (
  x: number,
  y: number,
  z: number,
  width: number,
  depth: number,
  height: number
): IsoBoxFaces => {
  const baseA = projectPoint([x, y, z]);
  const baseB = projectPoint([x + width, y, z]);
  const baseC = projectPoint([x + width, y + depth, z]);
  const baseD = projectPoint([x, y + depth, z]);
  const topA = projectPoint([x, y, z + height]);
  const topB = projectPoint([x + width, y, z + height]);
  const topC = projectPoint([x + width, y + depth, z + height]);
  const topD = projectPoint([x, y + depth, z + height]);

  return {
    top: [topA, topB, topC, topD],
    left: [topD, topA, baseA, baseD],
    right: [topA, topB, baseB, baseA]
  };
};

const polylineLength = (points: Point2D[]) =>
  points.reduce((total, point, index) => {
    if (index === 0) {
      return total;
    }

    const previous = points[index - 1];
    return total + Math.hypot(point.x - previous.x, point.y - previous.y);
  }, 0);

const samplePolyline = (points: Point2D[], sampleCount: number) => {
  if (points.length < 2) {
    return points;
  }

  const segments = points.slice(1).map((point, index) => {
    const previous = points[index];
    return {
      from: previous,
      to: point,
      length: Math.hypot(point.x - previous.x, point.y - previous.y)
    };
  });

  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  if (totalLength === 0) {
    return points;
  }

  return Array.from({ length: sampleCount }, (_, index) => {
    const targetDistance = (totalLength * index) / Math.max(1, sampleCount - 1);
    let traversed = 0;

    for (const segment of segments) {
      if (traversed + segment.length >= targetDistance) {
        const localProgress = (targetDistance - traversed) / Math.max(segment.length, 0.0001);
        return {
          x: lerp(segment.from.x, segment.to.x, localProgress),
          y: lerp(segment.from.y, segment.to.y, localProgress)
        };
      }

      traversed += segment.length;
    }

    return segments[segments.length - 1].to;
  });
};

const visibleStageIntensity = (stageBeat: number, stage: number) => {
  const progress = stageBeat - (stage - 1);
  if (progress <= 0) {
    return 0.14;
  }

  if (progress >= 1) {
    return 0.94;
  }

  return 0.14 + progress * 0.8;
};

const getFocusGlow = (zone: GridFlowFocusZone) => {
  switch (zone) {
    case 'entry': {
      const point = projectPoint([-2.54, 0.82, 1.02]);
      return { cx: point.x, cy: point.y, rx: 182, ry: 92 };
    }
    case 'switch': {
      const point = projectPoint([-1.04, 0.34, 0.94]);
      return { cx: point.x, cy: point.y, rx: 212, ry: 108 };
    }
    case 'core': {
      const point = projectPoint([0.82, -0.1, 1.02]);
      return { cx: point.x, cy: point.y, rx: 246, ry: 134 };
    }
    case 'output': {
      const point = projectPoint([2.3, -0.5, 1.02]);
      return { cx: point.x, cy: point.y, rx: 188, ry: 92 };
    }
    default: {
      const point = projectPoint([0.46, -0.18, 0.84]);
      return { cx: point.x, cy: point.y, rx: 336, ry: 186 };
    }
  }
};

const sceneFocus = (
  currentScene: GridFlowSceneState,
  nextScene: GridFlowSceneState,
  phaseProgress: number,
  reducedMotion: boolean
) => {
  const amount = reducedMotion ? 0 : phaseProgress;
  const currentGlow = getFocusGlow(currentScene.focusZone);
  const nextGlow = getFocusGlow(nextScene.focusZone);

  return {
    x: lerp(currentScene.diagramOffsetX, nextScene.diagramOffsetX, amount),
    y: lerp(currentScene.diagramOffsetY, nextScene.diagramOffsetY, amount),
    scale: lerp(currentScene.diagramScale, nextScene.diagramScale, amount),
    pathReveal: lerp(currentScene.pathReveal, nextScene.pathReveal, amount),
    energyStrength: lerp(currentScene.energyStrength, nextScene.energyStrength, amount),
    stageBeat: lerp(currentScene.stageBeat, nextScene.stageBeat, amount),
    glowCx: lerp(currentGlow.cx, nextGlow.cx, amount),
    glowCy: lerp(currentGlow.cy, nextGlow.cy, amount),
    glowRx: lerp(currentGlow.rx, nextGlow.rx, amount),
    glowRy: lerp(currentGlow.ry, nextGlow.ry, amount)
  };
};

const DiagramBoxShape = ({
  box,
  stageBeat
}: {
  box: DiagramBox;
  stageBeat: number;
}) => {
  const intensity = visibleStageIntensity(stageBeat, box.stage);
  const faces = createIsoBox(box.x, box.y, box.z, box.width, box.depth, box.height);

  return (
    <g>
      <polygon
        points={pointsToString(faces.left)}
        fill={`rgba(6, 14, 11, ${0.9 - intensity * 0.14})`}
        stroke={`rgba(90, 248, 203, ${0.06 + intensity * 0.16})`}
        strokeWidth={1}
      />
      <polygon
        points={pointsToString(faces.right)}
        fill={`rgba(9, 21, 17, ${0.84 - intensity * 0.1})`}
        stroke={`rgba(109, 168, 255, ${0.06 + intensity * 0.12})`}
        strokeWidth={1}
      />
      <polygon
        points={pointsToString(faces.top)}
        fill={`rgba(9, 25, 19, ${0.84 - intensity * 0.08})`}
        stroke={`rgba(226, 255, 246, ${0.06 + intensity * 0.22})`}
        strokeWidth={1.2}
      />
      <polygon
        points={pointsToString(faces.top)}
        fill={`rgba(86, 255, 207, ${0.02 + intensity * 0.16})`}
        filter="url(#grid-glow-soft)"
      />
    </g>
  );
};

const calloutOpacity = (
  labelId: string,
  currentScene: GridFlowSceneState,
  nextScene: GridFlowSceneState,
  amount: number
) => {
  const currentOpacity = currentScene.activeCalloutId === labelId ? 1 - amount : 0;
  const nextOpacity = nextScene.activeCalloutId === labelId ? amount : 0;
  return Math.max(currentOpacity, nextOpacity);
};

const DiagramCallout = ({
  label,
  currentScene,
  nextScene,
  phaseProgress,
  reducedMotion
}: {
  label: DiagramLabel;
  currentScene: GridFlowSceneState;
  nextScene: GridFlowSceneState;
  phaseProgress: number;
  reducedMotion: boolean;
}) => {
  const amount = reducedMotion ? 0 : phaseProgress;
  const opacity = calloutOpacity(label.id, currentScene, nextScene, amount);
  if (opacity <= 0.02) {
    return null;
  }

  const anchor = projectPoint(label.point);
  const labelX = anchor.x + label.dx;
  const labelY = anchor.y + label.dy;
  const rectWidth = label.text.length * 7.6 + 22;

  return (
    <g opacity={0.08 + opacity * 0.92}>
      <line
        x1={anchor.x}
        y1={anchor.y}
        x2={labelX + 10}
        y2={labelY + 16}
        stroke={`rgba(90,248,203,${0.24 + opacity * 0.56})`}
        strokeWidth={1}
        strokeDasharray="5 6"
      />
      <rect
        x={labelX}
        y={labelY}
        rx={18}
        width={rectWidth}
        height={32}
        fill="rgba(5, 12, 10, 0.72)"
        stroke={`rgba(90,248,203,${0.18 + opacity * 0.48})`}
        strokeWidth={1}
      />
      <text
        x={labelX + 12}
        y={labelY + 20}
        fill="#dffcf2"
        fontSize="11"
        fontWeight={600}
        letterSpacing="0.24em"
      >
        {label.text}
      </text>
    </g>
  );
};

export function GridFlowSceneCanvas({
  currentScene,
  nextScene,
  phaseProgress,
  reducedMotion
}: GridFlowSceneCanvasProps) {
  const focus = sceneFocus(currentScene, nextScene, phaseProgress, reducedMotion);

  const floorGrid = useMemo(() => {
    const lines: string[] = [];

    for (let x = -3.6; x <= 3.6; x += 1.2) {
      lines.push(
        pointsToString([
          projectPoint([x, -2.4, 0]),
          projectPoint([x, 2.4, 0])
        ])
      );
    }

    for (let y = -2.4; y <= 2.4; y += 1.2) {
      lines.push(
        pointsToString([
          projectPoint([-3.6, y, 0]),
          projectPoint([3.6, y, 0])
        ])
      );
    }

    return lines;
  }, []);

  const primaryRoute2D = useMemo(() => PRIMARY_ROUTE.map(projectPoint), []);
  const lowerBus2D = useMemo(() => LOWER_BUS_ROUTE.map(projectPoint), []);
  const upperBus2D = useMemo(() => UPPER_BUS_ROUTE.map(projectPoint), []);
  const tieRoutes2D = useMemo(() => TIE_ROUTES.map((route) => route.map(projectPoint)), []);
  const primaryRouteLength = useMemo(() => polylineLength(primaryRoute2D), [primaryRoute2D]);
  const activeRouteLength = primaryRouteLength * focus.pathReveal;
  const pulseSamples = useMemo(() => {
    const allSamples = samplePolyline(primaryRoute2D, 12);
    const visibleCount = Math.max(4, Math.round((allSamples.length - 1) * focus.pathReveal));
    return allSamples.slice(0, visibleCount);
  }, [focus.pathReveal, primaryRoute2D]);

  const deck = createIsoBox(
    FLOOR_BOUNDS.x,
    FLOOR_BOUNDS.y,
    -FLOOR_BOUNDS.height,
    FLOOR_BOUNDS.width,
    FLOOR_BOUNDS.depth,
    FLOOR_BOUNDS.height
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_42%,rgba(26,224,177,0.16),transparent_0,transparent_34%),radial-gradient(circle_at_82%_28%,rgba(109,168,255,0.14),transparent_0,transparent_28%),linear-gradient(180deg,rgba(6,11,9,0.18),rgba(4,8,7,0.9))]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(105,145,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(86,255,207,0.14) 1px, transparent 1px)',
          backgroundSize: '128px 128px'
        }}
      />

      <motion.div
        className="absolute inset-y-[-10%] left-[-28%] right-[-34%] transform-gpu will-change-transform sm:left-[-16%] sm:right-[-20%] lg:left-[4%] lg:right-[-8%]"
        animate={{
          x: focus.x,
          y: focus.y,
          scale: focus.scale
        }}
        transition={{
          duration: reducedMotion ? 0.24 : 1,
          ease: [0.22, 1, 0.36, 1]
        }}
        style={{ transformOrigin: '58% 54%' }}
      >
        <svg
          viewBox="0 0 1400 980"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <filter
              id="grid-glow-soft"
              x="-120%"
              y="-120%"
              width="340%"
              height="340%"
            >
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id="grid-glow-wide"
              x="-180%"
              y="-180%"
              width="460%"
              height="460%"
            >
              <feGaussianBlur stdDeviation="40" />
            </filter>
            <linearGradient
              id="route-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor="#7ab1ff"
              />
              <stop
                offset="42%"
                stopColor="#56ffcf"
              />
              <stop
                offset="100%"
                stopColor="#e1fff4"
              />
            </linearGradient>
          </defs>

          <ellipse
            cx={focus.glowCx}
            cy={focus.glowCy}
            rx={focus.glowRx}
            ry={focus.glowRy}
            fill={`rgba(86,255,207,${0.04 + focus.energyStrength * 0.12})`}
            filter="url(#grid-glow-wide)"
          />
          <ellipse
            cx={focus.glowCx}
            cy={focus.glowCy}
            rx={focus.glowRx * 0.62}
            ry={focus.glowRy * 0.54}
            fill={`rgba(109,168,255,${0.03 + focus.energyStrength * 0.08})`}
            filter="url(#grid-glow-wide)"
          />

          {floorGrid.map((line, index) => (
            <polyline
              key={`grid-${index}`}
              points={line}
              fill="none"
              stroke="rgba(115, 155, 141, 0.08)"
              strokeWidth={1}
            />
          ))}

          <polygon
            points={pointsToString(deck.left)}
            fill="rgba(5, 11, 9, 0.82)"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={1}
          />
          <polygon
            points={pointsToString(deck.right)}
            fill="rgba(7, 14, 11, 0.88)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />
          <polygon
            points={pointsToString(deck.top)}
            fill="rgba(8, 16, 13, 0.72)"
            stroke="rgba(140, 186, 165, 0.12)"
            strokeWidth={1.4}
          />

          <polyline
            points={pointsToString(lowerBus2D)}
            fill="none"
            stroke="rgba(116, 146, 135, 0.18)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points={pointsToString(upperBus2D)}
            fill="none"
            stroke="rgba(116, 146, 135, 0.18)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {tieRoutes2D.map((route, index) => (
            <polyline
              key={`tie-${index}`}
              points={pointsToString(route)}
              fill="none"
              stroke="rgba(119, 152, 139, 0.12)"
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}

          {STATION_BOXES.map((box) => (
            <DiagramBoxShape
              key={box.id}
              box={box}
              stageBeat={focus.stageBeat}
            />
          ))}

          <polyline
            points={pointsToString(primaryRoute2D)}
            fill="none"
            stroke="rgba(98, 130, 120, 0.18)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <polyline
            points={pointsToString(primaryRoute2D)}
            fill="none"
            stroke="url(#route-gradient)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${activeRouteLength} ${primaryRouteLength}`}
            filter="url(#grid-glow-soft)"
            opacity={0.22 + focus.energyStrength * 0.62}
          />

          {CALLOUTS.map((label) => (
            <DiagramCallout
              key={label.id}
              label={label}
              currentScene={currentScene}
              nextScene={nextScene}
              phaseProgress={phaseProgress}
              reducedMotion={reducedMotion}
            />
          ))}

          {reducedMotion
            ? pulseSamples
                .filter((_, index) => index >= pulseSamples.length - 2)
                .map((point, index) => (
                  <circle
                    key={`pulse-static-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={7 - index * 1.1}
                    fill="#d6fff2"
                    opacity={0.24 + index * 0.18}
                    filter="url(#grid-glow-soft)"
                  />
                ))
            : Array.from({ length: PULSE_COUNT }).map((_, index) => (
                <motion.circle
                  key={`pulse-${index}`}
                  r={7 + focus.energyStrength * 1.4}
                  fill="#d8fff3"
                  filter="url(#grid-glow-soft)"
                  animate={{
                    cx: pulseSamples.map((point) => point.x),
                    cy: pulseSamples.map((point) => point.y),
                    opacity: pulseSamples.map((_, sampleIndex) => {
                      const isEdge = sampleIndex < 2 || sampleIndex >= pulseSamples.length - 2;
                      return isEdge ? 0 : 0.2 + focus.energyStrength * 0.56;
                    }),
                    scale: pulseSamples.map((_, sampleIndex) =>
                      sampleIndex < 2 || sampleIndex >= pulseSamples.length - 2 ? 0.72 : 1
                    )
                  }}
                  transition={{
                    duration: Math.max(2.4, 5.4 - focus.energyStrength * 1.8),
                    repeat: Infinity,
                    ease: 'linear',
                    delay: index * 0.62
                  }}
                />
              ))}
        </svg>
      </motion.div>
    </div>
  );
}
