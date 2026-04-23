'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Trophy, Database, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';

import pyjuniorRaw from '@/data/operations/capstone-projects/pyspark/PJPySpark_Junior_Project.json';
import pymidRaw from '@/data/operations/capstone-projects/pyspark/PJPySpark_Mid_Project.json';
import pyseniorRaw from '@/data/operations/capstone-projects/pyspark/PJPySpark_Senior_Project.json';
import fabJuniorRaw from '@/data/operations/capstone-projects/fabric/PJFabric_Junior_Project.json';
import fabMidRaw from '@/data/operations/capstone-projects/fabric/PJFabric_Mid_Project.json';
import fabSeniorRaw from '@/data/operations/capstone-projects/fabric/PJFabric_Senior_Project.json';
import afJuniorRaw from '@/data/operations/capstone-projects/airflow/PJAirflow_Junior_Project.json';
import afMidRaw from '@/data/operations/capstone-projects/airflow/PJAirflow_Mid_Project.json';
import afSeniorRaw from '@/data/operations/capstone-projects/airflow/PJAirflow_Senior_Project.json';

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface CapstoneDataset { name: string; path: string; row_count: number; description: string }
interface CapstoneChapter { id: string; title: string; chapter_type: string; base_xp: number; narrative_context: string; task: string; validation_hint: string; scaffold?: { filename: string; language: string; preamble_comment: string; code: string }; evidence?: Array<Record<string, unknown>>; grading: { type: string; method?: string; fields?: Array<Record<string, unknown>>; template_fields?: Array<Record<string, unknown>>; rubric_criteria?: Array<Record<string, unknown>>; assertions?: Array<{ id: string; xp: number; description: string; check: string; failure_message: string }> }; hints: Array<{ tier: string; xp_cost: number; unlock_condition?: string; text: string }> }
interface CapstoneProject { id: string; version: string; track: string; level: string; scenario: string; total_xp: number; narrative_premise: string; datasets: CapstoneDataset[]; chapters: CapstoneChapter[] }

interface Props { topic: string; level: string }

const ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid:    { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};

function loadProject(topic: string, level: string): CapstoneProject | null {
  if (topic === 'pyspark' && level === 'junior') return pyjuniorRaw as unknown as CapstoneProject;
  if (topic === 'pyspark' && level === 'mid') return pymidRaw as unknown as CapstoneProject;
  if (topic === 'pyspark' && level === 'senior') return pyseniorRaw as unknown as CapstoneProject;
  if (topic === 'fabric' && level === 'junior') return fabJuniorRaw as unknown as CapstoneProject;
  if (topic === 'fabric' && level === 'mid') return fabMidRaw as unknown as CapstoneProject;
  if (topic === 'fabric' && level === 'senior') return fabSeniorRaw as unknown as CapstoneProject;
  if (topic === 'airflow' && level === 'junior') return afJuniorRaw as unknown as CapstoneProject;
  if (topic === 'airflow' && level === 'mid') return afMidRaw as unknown as CapstoneProject;
  if (topic === 'airflow' && level === 'senior') return afSeniorRaw as unknown as CapstoneProject;
  return null;
}

/** Transform capstone project into PracticeSet format for reuse of PracticeSetSession.
 *  Prepends 3 info tasks (Brief, Datasets, Stages) before the code chapters so
 *  the user reads the briefing as part of the same session flow. */
function toPracticeSet(project: CapstoneProject): any {
  // Build dataset descriptions as a formatted string
  const datasetsText = project.datasets
    .map((ds) => `${ds.name} (${ds.row_count} rows)\n${ds.description}`)
    .join('\n\n---\n\n');

  // Build stages overview as a formatted string
  const stagesText = project.chapters
    .map((ch, i) => `Stage ${i + 1}: ${ch.title} (${ch.base_xp} XP)\n${ch.narrative_context}`)
    .join('\n\n---\n\n');

  const infoTasks: any[] = [];

  // Build hidden setup code for each chapter based on dependencies.
  // This code is prepended invisibly at runtime so the user only sees
  // the current chapter's scaffold in the editor.
  const SETUP_SESSION = `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, upper, trim, year, month, when, sum as spark_sum, avg, count, round as spark_round
spark = SparkSession.builder.appName('nordgrid-daily-pipeline').config('spark.sql.shuffle.partitions', '8').getOrCreate()
`;
  const SETUP_LOAD_ALL = `df_readings = spark.read.csv('meter_readings_bronze.csv', header=True)
df_substation = spark.read.csv('substation_ref.csv', header=True)
df_meter_map = spark.read.csv('meter_substation_map.csv', header=True)
`;
  const SETUP_BRONZE = `df_bronze = (
    df_readings
    .filter(col('kwh_reading').isNotNull())
    .filter((col('kwh_reading').cast('double') > 0) & (col('kwh_reading').cast('double') < 10000))
    .filter(upper(trim(col('rgn_code'))).isin('NORTH', 'SOUTH', 'EAST', 'WEST'))
    .dropDuplicates(['mtr_id', 'reading_date'])
)
`;
  const SETUP_SILVER = `df_transformed = (
    df_bronze
    .withColumn('meter_id', col('mtr_id'))
    .withColumn('daily_kw', col('kwh_reading').cast('double'))
    .withColumn('date', col('reading_date').cast('date'))
    .withColumn('region', upper(trim(col('rgn_code'))))
    .withColumn('year', year(col('date')))
    .withColumn('month', month(col('date')))
    .withColumn('tier', when(col('daily_kw') < 500, 'low')
                            .when(col('daily_kw') < 2000, 'medium')
                            .when(col('daily_kw') < 4000, 'high')
                            .otherwise('critical'))
)
df_joined = df_transformed.join(df_meter_map, df_transformed.meter_id == df_meter_map.meter_id, how='left').join(df_substation, 'substation_id', how='left')
df_silver = df_joined.select(df_transformed.meter_id, 'daily_kw', 'date', 'region', 'year', 'month', 'tier', col('name').alias('substation_name'))
`;
  const SETUP_GOLD = `df_gold = df_silver.groupBy('region', 'month').agg(
    spark_round(spark_sum('daily_kw'), 1).alias('total_kw'),
    spark_round(avg('daily_kw'), 1).alias('avg_kw'),
    count('*').alias('reading_count')
)
`;

  // Junior project setup chain
  const juniorSetup: Record<string, string> = {
    chapter_1: '',
    chapter_2: SETUP_SESSION + SETUP_LOAD_ALL,
    chapter_3: SETUP_SESSION + SETUP_LOAD_ALL + SETUP_BRONZE,
    chapter_4: SETUP_SESSION + SETUP_LOAD_ALL + SETUP_BRONZE + SETUP_SILVER,
    chapter_5: SETUP_SESSION + SETUP_LOAD_ALL + SETUP_BRONZE + SETUP_SILVER + SETUP_GOLD,
  };

  // Mid project: chapters 1-2 are analysis (no code setup needed),
  // chapter 3 scaffold is self-contained, chapters 4-5 need silver from ch3
  const MID_SETUP_SESSION = `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, when, lit
spark = SparkSession.builder.appName('nordgrid-silver-fix').config('spark.sql.shuffle.partitions', '8').getOrCreate()
`;
  const MID_SETUP_DATA = `df_bronze = spark.read.csv('bronze_readings.csv', header=True, inferSchema=True)
df_substation = spark.read.csv('substation_ref_mid.csv', header=True, inferSchema=True)
`;
  const MID_SETUP_SILVER = `df_silver = spark.read.csv('silver_reference_mid.csv', header=True, inferSchema=True)
`;
  const midSetup: Record<string, string> = {
    chapter_1: '',
    chapter_2: '',
    chapter_3: '', // scaffold is self-contained
    chapter_4: MID_SETUP_SESSION + MID_SETUP_DATA + MID_SETUP_SILVER,
    chapter_5: MID_SETUP_SESSION + MID_SETUP_DATA + MID_SETUP_SILVER,
  };

  // Senior project: all template/design_artifact — no code setup needed
  const seniorSetup: Record<string, string> = {
    chapter_1: '', chapter_2: '', chapter_3: '', chapter_4: '', chapter_5: '',
  };

  // Fabric Junior: same NordGrid scenario, same CSV names, same setup chain as PySpark Junior
  const fabricJuniorSetup = juniorSetup;

  // Fabric Mid: chapters 1-2 template (no code), chapter 3 code (self-contained scaffold),
  // chapters 4-5 need bronze + silver data
  const FAB_MID_SETUP_SESSION = `from pyspark.sql import SparkSession
from pyspark.sql.functions import col, year, month, when, lit
spark = SparkSession.builder.appName('nordgrid-incident-fix').config('spark.sql.shuffle.partitions', '8').getOrCreate()
`;
  const FAB_MID_SETUP_DATA = `df_bronze = spark.read.csv('bronze_readings_today.csv', header=True, inferSchema=True)
df_silver = spark.read.csv('silver_meters_reference.csv', header=True, inferSchema=True)
`;
  const fabricMidSetup: Record<string, string> = {
    chapter_1: '',
    chapter_2: '',
    chapter_3: '',
    chapter_4: FAB_MID_SETUP_SESSION + FAB_MID_SETUP_DATA,
    chapter_5: FAB_MID_SETUP_SESSION + FAB_MID_SETUP_DATA,
  };

  // Fabric Senior: all template/design_artifact — no code
  const fabricSeniorSetup = seniorSetup;

  // Airflow Junior: code chapters, each scaffold is self-contained (inlined)
  const airflowJuniorSetup: Record<string, string> = {
    chapter_1: '', chapter_2: '', chapter_3: '', chapter_4: '', chapter_5: '',
  };

  // Airflow Mid: ch1-2 template, ch3-4 code (scaffolds self-contained), ch5 combined
  const airflowMidSetup: Record<string, string> = {
    chapter_1: '', chapter_2: '', chapter_3: '', chapter_4: '', chapter_5: '',
  };

  // Airflow Senior: all template/design_artifact — no code
  const airflowSeniorSetup = seniorSetup;

  const topic = project.track.toLowerCase();
  const lvl = project.level.toLowerCase();
  const chapterSetup =
    topic === 'fabric' && lvl === 'junior' ? fabricJuniorSetup :
    topic === 'fabric' && lvl === 'mid' ? fabricMidSetup :
    topic === 'fabric' && lvl === 'senior' ? fabricSeniorSetup :
    topic === 'airflow' && lvl === 'junior' ? airflowJuniorSetup :
    topic === 'airflow' && lvl === 'mid' ? airflowMidSetup :
    topic === 'airflow' && lvl === 'senior' ? airflowSeniorSetup :
    lvl === 'senior' ? seniorSetup :
    lvl === 'mid' ? midSetup :
    juniorSetup;

  // Code tasks (actual chapters)
  const codeTasks = project.chapters.map((ch) => ({
    id: ch.id,
    title: ch.title,
    type: ch.scaffold ? 'code' : 'template',
    estimatedMinutes: 15,
    description: {
      context: ch.narrative_context,
      task: ch.task,
      validationHint: ch.validation_hint,
    },
    evidence: ch.evidence ?? {},
    setupCode: chapterSetup[ch.id] || '',
    template: (() => {
      let rawFields = (ch.grading?.fields ?? ch.grading?.template_fields) as Array<Record<string, unknown>> | undefined;

      // design_artifact chapters: synthesize fields from rubric_criteria
      if ((!rawFields || rawFields.length === 0) && ch.grading?.rubric_criteria) {
        const criteria = ch.grading.rubric_criteria as Array<Record<string, unknown>>;
        rawFields = criteria.map((c) => ({
          id: c.id,
          prompt: c.description,
          input_type: 'short_text',
        }));
      }

      if (!rawFields || rawFields.length === 0) return undefined;

      const KNOWN_TYPES = new Set(['single_select', 'multi_select', 'short_text', 'numeric']);
      return {
        fields: rawFields.map((f) => {
          const rawType = (f.field_type ?? f.input_type ?? f.type) as string | undefined;
          const resolvedType = rawType && KNOWN_TYPES.has(rawType) ? rawType : 'short_text';
          return {
            id: f.id as string,
            label: (f.label ?? f.prompt) as string,
            type: resolvedType,
            options: f.options as string[] | undefined,
            correctAnswer: f.correct_answer ?? f.correct_answer_any_of ?? f.correct_answer_shape ?? f.correctAnswer,
            tolerance: f.tolerance as number | undefined,
            rationale: (f.failure_message ?? f.rationale_correct) as string | undefined,
          };
        }),
      };
    })(),
    starterScaffold: ch.scaffold ? {
      language: ch.scaffold.language,
      content: ch.scaffold.preamble_comment
        ? `${ch.scaffold.preamble_comment}\n\n${ch.scaffold.code}`
        : ch.scaffold.code,
    } : undefined,
    hints: ch.hints?.map((h) => ({
      tier: h.tier,
      xp_cost: h.xp_cost,
      unlock_condition: h.unlock_condition ?? 'always',
      text: h.text,
    })),
  }));

  return {
    topic: project.track.toLowerCase(),
    title: `${project.track} ${project.level} Capstone`,
    description: project.narrative_premise,
    version: project.version,
    metadata: {
      moduleId: `capstone-${project.id}`,
      trackLevel: project.level.toLowerCase(),
      estimatedDurationMinutes: (infoTasks.length + codeTasks.length) * 10,
      maximumDurationMinutes: (infoTasks.length + codeTasks.length) * 20,
      taskCount: infoTasks.length + codeTasks.length,
      scenarioCompany: project.scenario,
      modulePhase: 'capstone',
      taskTypeMix: { info: infoTasks.length, code: codeTasks.length },
    },
    datasets: project.datasets.map((ds) => ({
      id: ds.name.replace('.csv', ''),
      file: ds.name,
      description: ds.description,
    })),
    tasks: [...infoTasks, ...codeTasks],
  };
}

/* ── CSV Preview ────────────────────────────────────────────────────────────── */

function DatasetPreview({ filename, rgb, csvBase }: { filename: string; rgb: string; csvBase: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  useEffect(() => {
    if (!open || rows.length > 0) return;
    fetch(`${csvBase}/${filename}`)
      .then((r) => r.text())
      .then((text) => {
        const lines = text.trim().split('\n').map((l) => l.split(','));
        if (lines.length > 0) { setHeaders(lines[0]); setRows(lines.slice(1)); }
      })
      .catch(() => {});
  }, [open, filename, rows.length]);

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 mt-2 text-[11px] font-medium transition-colors cursor-pointer" style={{ color: 'rgba(255,255,255,0.35)' }}>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {open ? 'Hide data' : 'Preview data'}
      </button>
      {open && headers.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-[14px] border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <table className="min-w-full text-[11px]">
            <thead>
              <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {headers.map((h) => (<th key={h} className="px-3 py-2 text-left font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => (<td key={j} className="px-3 py-1.5 text-on-surface-variant/60 whitespace-nowrap">{cell || <span style={{ color: 'rgba(255,113,108,0.5)' }}>null</span>}</td>))}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Steps ──────────────────────────────────────────────────────────────────── */

const STEPS = [
  { id: 'brief', label: 'Brief' },
  { id: 'datasets', label: 'Datasets' },
  { id: 'stages', label: 'Stages' },
] as const;
type StepId = typeof STEPS[number]['id'];

/* ── Component ──────────────────────────────────────────────────────────────── */

export function CapstoneProjectView({ topic, level }: Props) {
  const ta = ACCENT[level.toLowerCase()] ?? ACCENT.junior;
  const project = loadProject(topic, level);
  const [step, setStep] = useState<StepId>('brief');
  const [running, setRunning] = useState(false);
  const backHref = `/learn/${topic}/theory/${level}`;

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-on-surface-variant/60 text-sm">Capstone project not found for {topic} / {level}.</p>
          <Link href={backHref} className="inline-flex items-center gap-2 text-[11px] tracking-widest uppercase text-on-surface-variant/50 hover:text-on-surface-variant transition-colors"><ArrowLeft className="h-3.5 w-3.5" /> Back to track</Link>
        </div>
      </div>
    );
  }

  // Launch the practice session runner with transformed data
  if (running) {
    const practiceSet = toPracticeSet(project);
    return <PracticeSetSession practiceSet={practiceSet} />;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canPrev = stepIndex > 0;
  const canNext = stepIndex < STEPS.length - 1;
  const isLast = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen pb-24 lg:pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto pt-8">

        {/* Back link */}
        <div style={{ opacity: 0, animation: 'fadeSlideUp .4s cubic-bezier(.16,1,.3,1) forwards' }}>
          <Link href={backHref} className="inline-flex items-center gap-2 text-on-surface-variant/50 hover:text-on-surface transition-colors duration-200">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[11px] tracking-widest uppercase">Back to Learning Path</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-8 mb-8" style={{ opacity: 0, animation: 'fadeSlideUp .4s cubic-bezier(.16,1,.3,1) 40ms forwards' }}>
          {STEPS.map((s, i) => (
            <button key={s.id} type="button" onClick={() => setStep(s.id)} className="flex items-center gap-2 transition-all duration-200">
              <div className="w-2 h-2 rounded-full transition-all duration-300" style={{ backgroundColor: step === s.id ? ta.color : 'rgba(255,255,255,0.08)', boxShadow: step === s.id ? `0 0 6px rgba(${ta.rgb},0.4)` : 'none' }} />
              <span className="text-[11px] font-medium tracking-widest uppercase transition-colors duration-200" style={{ color: step === s.id ? ta.color : 'rgba(255,255,255,0.2)' }}>{s.label}</span>
              {i < STEPS.length - 1 && <div className="w-6 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div key={step} style={{ opacity: 0, animation: 'fadeSlideUp .4s cubic-bezier(.16,1,.3,1) 80ms forwards' }}>
          <div className="relative p-8" style={{ background: '#181c20', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '22px' }}>
            <div className="absolute top-0 inset-x-0 h-[2px] rounded-t-[22px] overflow-hidden" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15), transparent 95%)' }} />

            {step === 'brief' && (
              <>
                <div className="flex items-start justify-between mb-5">
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Capstone Project · {project.scenario}</span>
                  <Trophy className="h-5 w-5 shrink-0" style={{ color: 'rgba(255,255,255,0.15)' }} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-on-surface mb-2">{project.track} {project.level} Capstone</h1>
                <div className="flex items-center gap-3 mb-8"><span className="text-[11px] tracking-widest uppercase text-on-surface-variant/40">{project.total_xp} XP · {project.chapters.length} stages</span></div>
                <div className="h-px mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <h2 className="text-sm font-semibold text-on-surface mb-3">Mission Brief</h2>
                <p className="text-[14px] leading-[1.9] text-on-surface-variant/65">{project.narrative_premise}</p>
              </>
            )}

            {step === 'datasets' && (
              <>
                <div className="flex items-center gap-2.5 mb-6">
                  <Database className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Datasets · {project.datasets.length} files</span>
                </div>
                <p className="text-[13px] text-on-surface-variant/45 mb-8">These are the data files you will work with. Read each description carefully — the defects are intentional.</p>
                <div className="space-y-5">
                  {project.datasets.map((ds) => (
                    <div key={ds.name} className="pb-5 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <code className="text-[12px] font-semibold text-on-surface">{ds.name}</code>
                        <span className="text-[10px] tracking-widest uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{ds.row_count} rows</span>
                      </div>
                      <p className="text-[13px] leading-relaxed text-on-surface-variant/55">
                        {ds.description.split('. ').slice(0, 2).join('. ').replace(/\.?$/, '.')}
                      </p>
                      <DatasetPreview filename={ds.name} rgb={ta.rgb} csvBase={`/data/capstone/${topic}-${level}`} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'stages' && (
              <>
                <div className="flex items-center gap-2.5 mb-6">
                  <Layers className="h-4 w-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Stages · {project.chapters.length} chapters</span>
                </div>
                <p className="text-[13px] text-on-surface-variant/45 mb-8">Complete each stage in order. Every stage builds on the previous one.</p>
                <div className="space-y-4">
                  {project.chapters.map((ch, i) => (
                    <div key={ch.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <p className="text-[14px] font-semibold text-on-surface">{ch.title}</p>
                          <span className="text-[10px] tracking-widest uppercase shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>{ch.base_xp} XP</span>
                        </div>
                        <p className="text-[12px] leading-relaxed text-on-surface-variant/50">{ch.narrative_context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6" style={{ opacity: 0, animation: 'fadeSlideUp .4s cubic-bezier(.16,1,.3,1) 120ms forwards' }}>
          <button type="button" onClick={() => canPrev && setStep(STEPS[stepIndex - 1].id)} disabled={!canPrev} className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] text-[12px] font-medium tracking-widest uppercase disabled:opacity-20 disabled:cursor-default cursor-pointer" style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          {isLast ? (
            <button type="button" onClick={() => setRunning(true)} className="flex items-center gap-2 px-8 py-3 rounded-[14px] text-[12px] font-bold tracking-widest uppercase transition-all duration-300 hover:opacity-90 active:scale-[0.98] cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              Begin Project <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button type="button" onClick={() => canNext && setStep(STEPS[stepIndex + 1].id)} className="flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-[12px] font-bold tracking-widest uppercase cursor-pointer" style={{ border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
