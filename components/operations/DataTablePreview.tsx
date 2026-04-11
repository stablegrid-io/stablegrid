'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronRight, Table2 } from 'lucide-react';

interface DataTablePreviewProps {
  topic: string;
  file: string;
  label?: string;
}

interface CsvData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  previewRows: number;
}

export function DataTablePreview({ topic, file, label }: DataTablePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<CsvData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (data) return; // Already fetched
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ topic, file });
      const res = await fetch(`/api/operations/datasets?${params}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to load dataset (${res.status})`);
      }

      const json: CsvData = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoading(false);
    }
  }, [topic, file, data]);

  useEffect(() => {
    if (expanded && !data && !loading) {
      fetchData();
    }
  }, [expanded, data, loading, fetchData]);

  const displayLabel = label ?? file.split('/').pop()?.replace('.csv', '') ?? file;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--rm-border)',
        backgroundColor: 'var(--rm-bg-elevated)',
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer"
        style={{ color: 'var(--rm-text-secondary)' }}
      >
        <Table2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--rm-text-secondary)' }} />
        <span className="text-[12px] font-medium flex-1 truncate">
          {displayLabel}
          {data && (
            <span className="ml-2 opacity-50">
              ({data.totalRows} row{data.totalRows !== 1 ? 's' : ''})
            </span>
          )}
        </span>
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
      </button>

      {/* Content area */}
      {expanded && (
        <div
          className="border-t"
          style={{ borderColor: 'var(--rm-border)' }}
        >
          {loading && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-4 rounded animate-pulse"
                  style={{
                    backgroundColor: 'var(--rm-border)',
                    width: `${80 - i * 10}%`,
                  }}
                />
              ))}
            </div>
          )}

          {error && (
            <div
              className="px-4 py-3 text-[12px]"
              style={{ color: 'rgb(239,68,68)' }}
            >
              {error}
            </div>
          )}

          {data && (
            <div className="overflow-x-auto" style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table className="w-full text-[12px] font-mono border-collapse">
                <thead>
                  <tr>
                    {data.headers.map((h, i) => (
                      <th
                        key={i}
                        className="sticky top-0 px-3 py-2 text-left font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: 'var(--rm-code-bg, #0d1117)',
                          color: 'var(--rm-text)',
                          borderBottom: '1px solid var(--rm-border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          className="px-3 py-1.5 whitespace-nowrap"
                          style={{
                            color: 'var(--rm-text-secondary)',
                            borderBottom: '1px solid var(--rm-border)',
                          }}
                        >
                          {cell || <span className="opacity-30">null</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.totalRows > data.previewRows && (
                <div
                  className="px-3 py-2 text-[11px] text-center"
                  style={{
                    color: 'var(--rm-text-secondary)',
                    backgroundColor: 'var(--rm-code-bg, #0d1117)',
                    borderTop: '1px solid var(--rm-border)',
                  }}
                >
                  Showing {data.previewRows} of {data.totalRows} rows
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
