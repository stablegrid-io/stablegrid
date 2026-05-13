import type { Metadata } from 'next';
import { BrandCell } from '@/components/brand/BrandCell';

export const metadata: Metadata = {
  title: 'Logo · stablegrid.io',
  robots: { index: false, follow: false }
};

// Tilted brand mark export — transparent-friendly dark canvas, rotated ~22°
// like the editorial hero. Export 1024 × 1024 PNG via DevTools screenshot.

export default function LogoExportPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
      <div
        className="flex items-center justify-center"
        style={{ width: '1024px', height: '1024px', flexShrink: 0 }}
      >
        <BrandCell style={{ width: '720px', height: '720px' }} />
      </div>
    </div>
  );
}
