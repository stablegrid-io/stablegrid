import type { DiagramData } from '@/data/operations';

interface DiagramRendererProps {
  diagram: DiagramData;
  accentColor: string;
}

const NODE_COLOR: Record<string, string> = {
  generator: '#20c0d0',
  load:      '#f04060',
  junction:  '#607080',
};

const PAD = { x: 70, yTop: 36, yBot: 52 }; // padding around content

export function DiagramRenderer({ diagram, accentColor }: DiagramRendererProps) {
  const nodeMap: Record<string, { x: number; y: number }> = {};
  diagram.nodes.forEach((n) => { nodeMap[n.id] = { x: n.x, y: n.y }; });

  // Tight bounding box from actual node positions
  const xs = diagram.nodes.map((n) => n.x);
  const ys = diagram.nodes.map((n) => n.y);
  const minX = Math.min(...xs) - PAD.x;
  const maxX = Math.max(...xs) + PAD.x;
  const minY = Math.min(...ys) - PAD.yTop;
  const maxY = Math.max(...ys) + PAD.yBot;
  const vbW = maxX - minX;
  const vbH = maxY - minY;

  const NW = 64, NH = 38, bLen = 9;

  return (
    <svg
      viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
      className="w-full"
      aria-label="Network topology diagram"
    >
      {/* Dot grid */}
      <defs>
        <pattern id="diagDots" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="0.6" fill="#141e28" />
        </pattern>
      </defs>
      <rect x={minX} y={minY} width={vbW} height={vbH} fill="url(#diagDots)" />

      {/* Edges */}
      {diagram.edges.map((edge, i) => {
        const from = nodeMap[edge.from];
        const to = nodeMap[edge.to];
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <g key={`e${i}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#1e2e3a" strokeWidth="2" />
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={`${accentColor}18`} strokeWidth="1" />
            {edge.label && (
              <g>
                <rect x={midX - 46} y={midY + 5} width="92" height="16" fill="#080c14" stroke="#1a2530" strokeWidth="0.6" rx="2" />
                <text x={midX} y={midY + 17} textAnchor="middle" fontSize="9" fill="#4a6878" fontFamily="'Courier New', monospace">
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {diagram.nodes.map((node) => {
        const color = NODE_COLOR[node.type] ?? '#405060';
        const nx = node.x, ny = node.y;
        return (
          <g key={node.id}>
            {/* Glow */}
            <rect x={nx - NW/2 - 3} y={ny - NH/2 - 3} width={NW + 6} height={NH + 6} rx="3" fill={`${color}08`} />
            {/* Body */}
            <rect x={nx - NW/2} y={ny - NH/2} width={NW} height={NH} rx="2" fill="#080c14" stroke={`${color}50`} strokeWidth="1" />
            {/* Corner brackets */}
            <line x1={nx-NW/2}      y1={ny-NH/2}      x2={nx-NW/2+bLen} y2={ny-NH/2}      stroke={color} strokeWidth="1.8"/>
            <line x1={nx-NW/2}      y1={ny-NH/2}      x2={nx-NW/2}      y2={ny-NH/2+bLen} stroke={color} strokeWidth="1.8"/>
            <line x1={nx+NW/2}      y1={ny-NH/2}      x2={nx+NW/2-bLen} y2={ny-NH/2}      stroke={color} strokeWidth="1.8"/>
            <line x1={nx+NW/2}      y1={ny-NH/2}      x2={nx+NW/2}      y2={ny-NH/2+bLen} stroke={color} strokeWidth="1.8"/>
            <line x1={nx-NW/2}      y1={ny+NH/2}      x2={nx-NW/2+bLen} y2={ny+NH/2}      stroke={color} strokeWidth="1.8"/>
            <line x1={nx-NW/2}      y1={ny+NH/2}      x2={nx-NW/2}      y2={ny+NH/2-bLen} stroke={color} strokeWidth="1.8"/>
            <line x1={nx+NW/2}      y1={ny+NH/2}      x2={nx+NW/2-bLen} y2={ny+NH/2}      stroke={color} strokeWidth="1.8"/>
            <line x1={nx+NW/2}      y1={ny+NH/2}      x2={nx+NW/2}      y2={ny+NH/2-bLen} stroke={color} strokeWidth="1.8"/>
            {/* Label */}
            <text x={nx} y={ny + 4} textAnchor="middle" fontSize="9.5" fill={color} fontFamily="'Courier New', monospace" fontWeight="600">
              {node.label}
            </text>
            {/* Value below node */}
            {node.value && (
              <text x={nx} y={ny + NH/2 + 14} textAnchor="middle" fontSize="9" fill="#4a6878" fontFamily="'Courier New', monospace">
                {node.value}
              </text>
            )}
          </g>
        );
      })}

      {/* Annotation */}
      {diagram.annotation && (
        <text x={(minX + maxX) / 2} y={maxY - 6} textAnchor="middle" fontSize="9" fill="#2a3a48" fontFamily="'Courier New', monospace" fontStyle="italic">
          {diagram.annotation}
        </text>
      )}
    </svg>
  );
}
