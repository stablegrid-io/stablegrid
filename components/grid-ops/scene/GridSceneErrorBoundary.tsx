'use client';

import type { ReactNode } from 'react';
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GridSceneErrorBoundaryProps {
  children: ReactNode;
}

interface GridSceneErrorBoundaryState {
  hasError: boolean;
}

export class GridSceneErrorBoundary extends Component<
  GridSceneErrorBoundaryProps,
  GridSceneErrorBoundaryState
> {
  state: GridSceneErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('Grid scene crashed:', error);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <section className="flex h-[58vh] min-h-[520px] w-full items-center justify-center rounded-2xl border border-amber-500/40 bg-[#111722] p-6 text-center text-[#e2eaf8]">
        <div>
          <AlertTriangle className="mx-auto h-7 w-7 text-amber-300" />
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.08em] text-amber-200">
            Simulation scene unavailable
          </p>
          <p className="mt-2 text-sm text-[#b5c2d7]">
            Reload the page to retry the 2.5D renderer.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#3b4a5e] bg-[#172131] px-3 py-1.5 text-sm font-medium text-[#e5eefb] transition hover:border-brand-400/70"
          >
            <RefreshCw className="h-4 w-4" />
            Reload scene
          </button>
        </div>
      </section>
    );
  }
}
