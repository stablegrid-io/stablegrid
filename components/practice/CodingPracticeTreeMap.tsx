'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Lock, Code2 } from 'lucide-react';

/* ── Track accent colours ──────────────────────────────────────────────────── */

const TRACK_ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid:    { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};

/* ── Placeholder modules per language + level ─────────────────────────────── */

const EYEBROWS = [
  'Fundamentals', 'Data Types', 'Control Flow', 'Functions',
  'Collections', 'I/O', 'Error Handling', 'OOP',
  'Modules', 'Testing',
];

interface PlaceholderModule {
  id: string;
  title: string;
  description: string;
  /** When set, the card becomes a link to this practice route. */
  practiceHref?: string;
}

const MODULES: Record<string, Record<string, PlaceholderModule[]>> = {
  python: {
    junior: [
      { id: 'py-j-01', title: 'Variables & Data Types', description: 'Integers, floats, strings, booleans, and type casting basics.' },
      { id: 'py-j-02', title: 'Control Flow', description: 'If/else branching, for/while loops, and comprehensions.' },
      { id: 'py-j-03', title: 'Functions & Scope', description: 'Defining functions, arguments, return values, and variable scope.' },
      { id: 'py-j-04', title: 'Collections', description: 'Lists, tuples, dictionaries, and sets with common operations.' },
      { id: 'py-j-05', title: 'String Manipulation', description: 'Slicing, formatting, regex basics, and encoding.' },
      { id: 'py-j-06', title: 'File I/O', description: 'Reading and writing files, CSV handling, and path operations.' },
      { id: 'py-j-07', title: 'Error Handling', description: 'Try/except blocks, custom exceptions, and defensive coding.' },
      { id: 'py-j-08', title: 'Modules & Packages', description: 'Imports, virtual environments, and pip package management.' },
    ],
    mid: [
      { id: 'py-m-01', title: 'OOP Patterns', description: 'Classes, inheritance, mixins, and design patterns.' },
      { id: 'py-m-02', title: 'Decorators & Generators', description: 'Higher-order functions, iterators, and lazy evaluation.' },
      { id: 'py-m-03', title: 'Concurrency', description: 'Threading, multiprocessing, and async/await patterns.' },
      { id: 'py-m-04', title: 'Data Processing', description: 'Pandas fundamentals, NumPy operations, and data pipelines.' },
      { id: 'py-m-05', title: 'Testing & Quality', description: 'Pytest, mocking, coverage, and CI integration.' },
      { id: 'py-m-06', title: 'API Development', description: 'REST APIs with FastAPI/Flask, request handling, and validation.' },
    ],
    senior: [
      { id: 'py-s-01', title: 'Performance Optimization', description: 'Profiling, Cython, memory management, and algorithmic efficiency.' },
      { id: 'py-s-02', title: 'System Design', description: 'Architecture patterns, microservices, and distributed systems.' },
      { id: 'py-s-03', title: 'Advanced Async', description: 'Event loops, connection pooling, and high-throughput I/O.' },
      { id: 'py-s-04', title: 'Production Pipelines', description: 'Orchestration, monitoring, logging, and deployment strategies.' },
    ],
  },
  sql: {
    junior: [
      { id: 'sql-j-01', title: 'SELECT & Filtering', description: 'Basic queries, WHERE clauses, ORDER BY, and LIMIT.' },
      { id: 'sql-j-02', title: 'Joins', description: 'INNER, LEFT, RIGHT, FULL joins and cross joins.' },
      { id: 'sql-j-03', title: 'Aggregations', description: 'GROUP BY, HAVING, COUNT, SUM, AVG, and aggregate functions.' },
      { id: 'sql-j-04', title: 'Subqueries', description: 'Inline subqueries, correlated subqueries, and CTEs.' },
      { id: 'sql-j-05', title: 'Data Types & Casting', description: 'Numeric, string, date types, and type conversions.' },
      { id: 'sql-j-06', title: 'Insert, Update, Delete', description: 'DML operations, transactions, and data modification.' },
    ],
    mid: [
      { id: 'sql-m-01', title: 'Window Functions', description: 'ROW_NUMBER, RANK, LAG/LEAD, and running totals.' },
      { id: 'sql-m-02', title: 'Complex Joins', description: 'Self-joins, anti-joins, and multi-table operations.' },
      { id: 'sql-m-03', title: 'Query Optimization', description: 'EXPLAIN plans, indexing strategies, and query tuning.' },
      { id: 'sql-m-04', title: 'Advanced CTEs', description: 'Recursive CTEs, materialized views, and temp tables.' },
      { id: 'sql-m-05', title: 'Stored Procedures', description: 'Functions, procedures, triggers, and dynamic SQL.' },
    ],
    senior: [
      { id: 'sql-s-01', title: 'Performance at Scale', description: 'Partitioning, sharding, and distributed query execution.' },
      { id: 'sql-s-02', title: 'Data Modeling', description: 'Star/snowflake schemas, normalization, and dimensional modeling.' },
      { id: 'sql-s-03', title: 'Migration Patterns', description: 'Schema evolution, zero-downtime migrations, and versioning.' },
    ],
  },
  pyspark: {
    junior: [
      { id: 'ps-j-01', title: 'SparkSession & RDDs', description: 'Creating sessions, understanding RDDs, and basic transformations.' },
      { id: 'ps-j-02', title: 'DataFrame Basics', description: 'Creating DataFrames, selecting columns, and filtering rows.' },
      { id: 'ps-j-03', title: 'Aggregations & GroupBy', description: 'GroupBy operations, aggregate functions, and pivot tables.', practiceHref: '/operations/practice/pyspark/junior/PSPJ1' },
      { id: 'ps-j-04', title: 'Joins & Unions', description: 'Join types, broadcast joins, and combining DataFrames.' },
      { id: 'ps-j-05', title: 'UDFs & Column Ops', description: 'User-defined functions, column expressions, and when/otherwise.' },
      { id: 'ps-j-06', title: 'Reading & Writing Data', description: 'Parquet, CSV, JSON I/O, partitioning, and schema inference.' },
      { id: 'ps-j-07', title: 'Window Functions', description: 'Ranking, running aggregates, and frame specifications.' },
    ],
    mid: [
      { id: 'ps-m-01', title: 'Catalyst & Tungsten', description: 'Query plans, optimization rules, and code generation.' },
      { id: 'ps-m-02', title: 'Shuffle & Partitioning', description: 'Repartition strategies, skew handling, and shuffle tuning.' },
      { id: 'ps-m-03', title: 'Spark SQL Advanced', description: 'Complex types, higher-order functions, and SQL analytics.' },
      { id: 'ps-m-04', title: 'Delta Lake', description: 'ACID transactions, time travel, and merge operations.' },
      { id: 'ps-m-05', title: 'Testing Pipelines', description: 'Unit testing Spark jobs, fixtures, and test data generation.' },
    ],
    senior: [
      { id: 'ps-s-01', title: 'Performance Tuning', description: 'Memory management, executor sizing, and adaptive query execution.' },
      { id: 'ps-s-02', title: 'Streaming Pipelines', description: 'Structured Streaming, watermarks, and exactly-once semantics.' },
      { id: 'ps-s-03', title: 'Production Architecture', description: 'Job scheduling, monitoring, lineage, and governance patterns.' },
    ],
  },
};

/* ── Language labels ───────────────────────────────────────────────────────── */

const LANG_LABELS: Record<string, string> = {
  python: 'Python',
  sql: 'SQL',
  pyspark: 'PySpark',
};

const LEVEL_LABELS: Record<string, string> = {
  junior: 'Junior',
  mid: 'Mid',
  senior: 'Senior',
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export function CodingPracticeTreeMap({ language, level }: { language: string; level: string }) {
  const ta = TRACK_ACCENT[level] ?? TRACK_ACCENT.junior;
  const modules = MODULES[language]?.[level] ?? [];
  const langLabel = LANG_LABELS[language] ?? language;

  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-8">

        <Link
          href={`/practice/coding/${language}`}
          className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] text-on-surface-variant/50 hover:text-on-surface-variant transition-colors uppercase tracking-widest"
        >
          <ArrowLeft className="h-4 w-4" />
          Track Selection
        </Link>

        {/* Title */}
        <div className="text-center mb-16" style={{ opacity: 0, animation: 'fadeSlideUp .5s cubic-bezier(.16,1,.3,1) forwards' }}>
          <div
            className="inline-block w-10 h-1.5 mb-6 rounded-full"
            style={{ backgroundColor: ta.color, boxShadow: `0 0 12px rgba(${ta.rgb},0.5)` }}
          />
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-on-surface">
            Learning Path
          </h1>
          <p className="mt-3 font-mono text-[12px] tracking-widest text-on-surface-variant/35 uppercase">
            Master each node to unlock the next stage
          </p>
        </div>

        {/* Zigzag tree map */}
        <div className="relative">
          {/* Center vertical connector line */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px hidden md:block"
            style={{ background: `linear-gradient(to bottom, rgba(${ta.rgb},0.25), rgba(${ta.rgb},0.05))` }}
          />

          {modules.map((mod, i) => {
            const isLeft = i % 2 === 0;
            const stagger = i * 70 + 100;
            const eyebrow = EYEBROWS[i % EYEBROWS.length];
            const isAvailable = !!mod.practiceHref;

            const cardInner = (
              <div
                className="relative p-7 h-full flex flex-col transition-all duration-300 group-hover:scale-[1.01]"
                style={{
                  background: '#181c20',
                  border: isAvailable
                    ? `1px solid rgba(${ta.rgb},0.18)`
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '22px',
                }}
              >
                {/* Top row: eyebrow + icon */}
                <div className="flex items-start justify-between mb-4">
                  <span
                    className="font-mono text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: ta.color }}
                  >
                    {eyebrow}
                  </span>
                  <Code2 className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.12)' }} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold tracking-tight text-on-surface mb-2">
                  {mod.title}
                </h3>

                {/* Description */}
                <p className="text-[12px] leading-relaxed text-on-surface-variant/40 mb-5 line-clamp-2">
                  {mod.description}
                </p>

                {/* Progress bar */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-on-surface-variant/35 tracking-wide">Module Progress</span>
                    <span className="font-mono text-[13px] font-bold" style={{ color: ta.color }}>0%</span>
                  </div>
                  <div className="w-full overflow-hidden" style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 100 }}>
                    <div style={{ width: '0%', height: '100%', background: '#fff', borderRadius: 100, opacity: 0.85 }} />
                  </div>
                </div>

                {/* CTA */}
                {isAvailable ? (
                  <div
                    className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300 group-hover:brightness-110"
                    style={{
                      border: `1px solid rgba(${ta.rgb},0.35)`,
                      backgroundColor: `rgba(${ta.rgb},0.1)`,
                      color: ta.color,
                      borderRadius: '14px',
                    }}
                  >
                    Begin Practice
                  </div>
                ) : (
                  <div
                    className="mt-auto w-full py-3 text-center font-mono text-[12px] font-bold tracking-widest uppercase transition-all duration-300"
                    style={{
                      border: '1px dashed rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.2)',
                      borderRadius: '14px',
                    }}
                  >
                    Under Construction
                  </div>
                )}
              </div>
            );

            return (
              <div
                key={mod.id}
                className="relative flex items-center mb-16 md:mb-20"
                style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${stagger}ms forwards` }}
              >
                {/* Center connector dot */}
                <div className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center justify-center">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: '#0c0e10',
                      border: isAvailable
                        ? `2px solid rgba(${ta.rgb},0.5)`
                        : `2px solid rgba(255,255,255,0.12)`,
                    }}
                  />
                </div>

                {/* Card — alternating left/right */}
                <div className={`w-full md:w-[calc(50%-32px)] ${isLeft ? 'md:mr-auto' : 'md:ml-auto'}`}>
                  {isAvailable ? (
                    <Link href={mod.practiceHref!} className="group block h-full">
                      {cardInner}
                    </Link>
                  ) : (
                    <div className="group block h-full">{cardInner}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Mastery node */}
          <div
            className="relative flex justify-center py-12"
            style={{ opacity: 0, animation: `fadeSlideUp .5s cubic-bezier(.16,1,.3,1) ${modules.length * 70 + 200}ms forwards` }}
          >
            <div
              className="w-14 h-14 flex items-center justify-center z-10"
              style={{
                background: '#0c0e10',
                border: '3px solid rgba(255,255,255,0.06)',
                borderRadius: '50%',
              }}
            >
              <Check className="h-6 w-6" style={{ color: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
