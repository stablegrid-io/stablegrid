import Image from 'next/image';
import Link from 'next/link';
import { NOTEBOOKS } from '@/data/notebooks';

const NODE_IDS = ['AX-772', 'VN-004', 'KR-819', 'PL-551', 'QZ-330', 'MX-108'];
const COVER_IMAGES = ['/grid-assets/notebook-1.jpg', '/grid-assets/notebook-2.jpg', '/grid-assets/notebook-3.jpg'];
const ACCENT_COLORS = [
  { color: '#99f7ff', rgb: '153,247,255', label: 'primary' },
  { color: '#bf81ff', rgb: '191,129,255', label: 'secondary' },
  { color: '#ffc965', rgb: '255,201,101', label: 'tertiary' },
];

export default function OperationsNotebooksPage() {
  return (
    <main className="min-h-screen pb-24 lg:pb-10">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 border-l-2 border-primary pl-6 py-2">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black font-headline tracking-tighter text-on-surface">DATA_VOLUMES</h1>
            <p className="font-mono text-xs text-primary/60 mt-2 uppercase tracking-[0.2em]">Active Neural Node Environment // Sector 7G</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 bg-primary/10 border border-primary/20 font-mono text-[10px] tracking-widest text-primary">SYSTEM_NODES</span>
            <span className="px-3 py-1.5 border border-outline-variant font-mono text-[10px] tracking-widest text-on-surface-variant">NEURAL_STREAMS</span>
          </div>
        </div>

        {/* Notebook gallery grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {NOTEBOOKS.map((notebook, index) => {
            const nodeId = NODE_IDS[index % NODE_IDS.length];
            const coverImage = COVER_IMAGES[index % COVER_IMAGES.length];
            const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
            const issueCount = notebook.cells?.reduce((sum, cell) => sum + (cell.issues?.length ?? 0), 0) ?? 0;
            const totalLines = notebook.cells?.reduce((sum, cell) => sum + (cell.lines?.length ?? 0), 0) ?? 0;
            const dataYield = totalLines > 0 ? Math.min(100, Math.round((1 - issueCount / Math.max(1, totalLines)) * 100)) : 85;
            const yieldBars = Math.round((dataYield / 100) * 6);
            const stabilityLabel = issueCount === 0 ? 'OPTIMAL' : issueCount <= 2 ? 'STABLE' : 'FLUCTUATING';
            const stabilityBars = issueCount === 0 ? 5 : issueCount <= 2 ? 4 : 2;
            const stabilityColor = issueCount > 2 ? 'error' : 'tertiary';

            return (
              <div
                key={notebook.id}
                className="group relative bg-surface-container-low border border-outline-variant/20 hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Cover image */}
                <div className="h-40 overflow-hidden relative">
                  <Image
                    src={coverImage}
                    alt={notebook.title}
                    fill
                    className="object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                  <div className="absolute top-3 left-3 backdrop-blur-md px-2 py-0.5 border-l-2" style={{ backgroundColor: `rgba(${accent.rgb},0.2)`, borderColor: accent.color }}>
                    <span className="font-mono text-[9px] tracking-tighter" style={{ color: accent.color }}>NODE_ID: {nodeId}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-headline font-bold text-base tracking-tight text-on-surface uppercase">
                      {notebook.title.replace(/ /g, '_')}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {/* Data Yield */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">
                        <span>DATA_YIELD</span>
                        <span>{dataYield}%</span>
                      </div>
                      <div className="flex gap-1 h-1">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className={`flex-1 ${i < yieldBars ? 'bg-primary' : 'bg-primary/20'}`} />
                        ))}
                      </div>
                    </div>

                    {/* Stability */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-mono text-on-surface-variant uppercase tracking-widest">
                        <span>STABILITY</span>
                        <span>{stabilityLabel}</span>
                      </div>
                      <div className="flex gap-1 h-1">
                        {Array.from({ length: 6 }, (_, i) => (
                          <div key={i} className={`flex-1 ${i < stabilityBars ? `bg-${stabilityColor}` : `bg-${stabilityColor}/20`}`}
                            style={{ backgroundColor: i < stabilityBars ? (stabilityColor === 'error' ? '#ff716c' : '#ffc965') : undefined }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-auto pt-4 flex justify-between items-center border-t border-outline-variant/10">
                    <span className="font-mono text-[9px] text-on-surface-variant tracking-widest">
                      {notebook.difficulty.toUpperCase()}
                    </span>
                    <Link
                      href={`/practice/notebooks?notebook=${notebook.id}`}
                      className="bg-primary text-on-primary font-headline font-black text-[10px] tracking-widest px-4 py-1.5 hover:shadow-[0_0_15px_rgba(0,242,255,0.4)] transition-all uppercase"
                    >
                      OPEN_VOLUME
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
