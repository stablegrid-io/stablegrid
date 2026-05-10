#!/usr/bin/env node
// One-shot converter: 21 download folders → FND_*_Practice.json files
// + per-module CSV data dirs. Source folders are MCQ recognition exercises
// with the format documented in the AskUserQuestion answer; output is the
// PracticeSet shape consumed by getPracticeSet().

import fs from 'node:fs';
import path from 'node:path';

const DOWNLOADS = '/Users/nedasvaitkus/Downloads';
const OUTPUT_DIR = path.resolve(
  process.argv[1],
  '../../data/operations/practice-sets/pyspark'
);

// folder name → { subject, level, label }
const FOLDERS = [
  { dir: 'pyspark_streaming_senior_track',          subject: 'STREAMING',    level: 'senior', label: 'Structured Streaming' },
  { dir: 'pyspark_streaming_mid_track',             subject: 'STREAMING',    level: 'mid',    label: 'Structured Streaming' },
  { dir: 'pyspark_streaming_junior_track',          subject: 'STREAMING',    level: 'junior', label: 'Structured Streaming' },
  { dir: 'pyspark_storage_layout_senior_track',     subject: 'STORAGE',      level: 'senior', label: 'Storage Layout' },
  { dir: 'pyspark_storage_layout_mid_track',        subject: 'STORAGE',      level: 'mid',    label: 'Storage Layout' },
  { dir: 'pyspark_storage_layout_junior_track',     subject: 'STORAGE',      level: 'junior', label: 'Storage Layout' },
  { dir: 'pyspark_plan_reading_senior_track',       subject: 'PLANS',        level: 'senior', label: 'Plan Reading' },
  { dir: 'pyspark_plan_reading_mid_track',          subject: 'PLANS',        level: 'mid',    label: 'Plan Reading' },
  { dir: 'pyspark_plan_reading_junior_track',       subject: 'PLANS',        level: 'junior', label: 'Plan Reading' },
  { dir: 'pyspark_memory_skew_senior_track',        subject: 'MEMORY',       level: 'senior', label: 'Memory & Skew' },
  { dir: 'pyspark_memory_skew_mid_track',           subject: 'MEMORY',       level: 'mid',    label: 'Memory & Skew' },
  { dir: 'pyspark_memory_skew_junior_track',        subject: 'MEMORY',       level: 'junior', label: 'Memory & Skew' },
  { dir: 'pyspark_joins_shuffles_senior_track',     subject: 'JOINS',        level: 'senior', label: 'Joins & Shuffles' },
  { dir: 'pyspark_joins_shuffles_mid_track',        subject: 'JOINS',        level: 'mid',    label: 'Joins & Shuffles' },
  { dir: 'pyspark_joins_shuffles_junior_track',     subject: 'JOINS',        level: 'junior', label: 'Joins & Shuffles' },
  { dir: 'data_manip_senior',                       subject: 'MANIPULATION', level: 'senior', label: 'Data Manipulation' },
  { dir: 'data_manipulation_mid_track',             subject: 'MANIPULATION', level: 'mid',    label: 'Data Manipulation' },
  { dir: 'data_manipulation_junior_track',          subject: 'MANIPULATION', level: 'junior', label: 'Data Manipulation' },
  { dir: 'pyspark_aggregations_senior_track',       subject: 'AGGREGATIONS', level: 'senior', label: 'Aggregations' },
  { dir: 'pyspark_aggregations_mid_recognition_track',    subject: 'AGGREGATIONS', level: 'mid',    label: 'Aggregations' },
  { dir: 'pyspark_aggregations_junior_recognition_track', subject: 'AGGREGATIONS', level: 'junior', label: 'Aggregations' },
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const formatInputSample = (sample) => {
  if (!sample) return null;
  if (typeof sample === 'string') return sample;
  if (Array.isArray(sample.rows) && Array.isArray(sample.columns)) {
    const head = sample.description ? sample.description + '\n\n' : '';
    const cols = sample.columns.join(' | ');
    const sep  = sample.columns.map(() => '---').join(' | ');
    const body = sample.rows
      .map((r) => r.map((v) => (v === null ? '∅ null' : String(v))).join(' | '))
      .join('\n');
    return `${head}${cols}\n${sep}\n${body}`;
  }
  return Object.entries(sample)
    .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: ${typeof v === 'object' ? JSON.stringify(v, null, 2) : v}`)
    .join('\n\n');
};

const formatDistractorRationale = (analysis = []) =>
  analysis
    .map((d) => `Option ${d.option_id}: ${d.misconception ?? d.explanation ?? ''}`)
    .join('\n\n');

function convertExercise(srcExercise, taskIndex, moduleId) {
  const ex = srcExercise;
  const opts = ex.content?.options ?? [];
  const correctOption = opts.find((o) => o.id === ex.answer?.correct_option);
  const correctText = correctOption?.text ?? opts[0]?.text ?? '';

  const evidence = [];
  const inputSampleText = formatInputSample(ex.input_sample);
  if (inputSampleText) {
    evidence.push({ type: 'text', title: 'Input sample', content: inputSampleText });
  }
  if (ex.dataset) {
    evidence.push({ type: 'text', title: 'Dataset', content: ex.dataset });
  }
  const snippet = ex.content?.snippet;
  if (snippet?.code) {
    evidence.push({
      type: 'code_block',
      label: 'Snippet',
      language: snippet.language ?? 'text',
      content: snippet.code,
    });
  }

  const taskNum = String(taskIndex + 1).padStart(2, '0');
  const fieldId = `${moduleId.replace(/^module-/, '')}-${taskNum}-F1`;
  const taskType = (ex.type ?? 'find-the-bug').replace(/-/g, '_');

  return {
    id: `${moduleId}-task-${taskNum}`,
    title: ex.title ?? `Task ${taskNum}`,
    type: taskType,
    estimatedMinutes: ex.estimated_minutes ?? 12,
    description: {
      context: ex.scenario ?? '',
      task: ex.content?.question ?? '',
    },
    evidence,
    template: {
      fields: [
        {
          id: fieldId,
          type: 'single_select',
          label: ex.content?.question ?? '',
          options: opts.map((o) => o.text),
          correctAnswer: correctText,
          rationale: ex.answer?.explanation ?? '',
          distractorRationale: formatDistractorRationale(ex.answer?.distractor_analysis),
        },
      ],
    },
    pssReference: ex.psi_reference ?? '',
  };
}

const MAX_TASKS_PER_MODULE = 10;

function buildPracticeSet({ subject, level, label, srcDir }) {
  const exDir = path.join(srcDir, 'exercises');
  const files = fs.readdirSync(exDir).filter((f) => f.endsWith('.json')).sort();
  const exercises = files
    .map((f) => JSON.parse(fs.readFileSync(path.join(exDir, f), 'utf-8')))
    .slice(0, MAX_TASKS_PER_MODULE);

  const moduleId = `module-FND-${subject}-${level.toUpperCase()}`;
  const moduleSlug = `FND_${subject}_${level.toUpperCase()}`;
  const dataDirName = `${moduleSlug}_data`;

  const tasks = exercises.map((ex, i) => convertExercise(ex, i, moduleId));

  const totalMinutes = tasks.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);

  const taskTypeMix = {};
  for (const t of tasks) {
    taskTypeMix[t.type] = (taskTypeMix[t.type] ?? 0) + 1;
  }

  const allTaskIds = tasks.map((t) => t.id);
  const datasets = ['meters.csv', 'substations.csv', 'tariffs.csv'].map((name) => ({
    id: `${moduleSlug}_${path.basename(name, '.csv')}`,
    file: `${dataDirName}/${name}`,
    description: `${name} reference data for ${label} (${level}).`,
    usedByTasks: allTaskIds,
  }));

  const trackVersion = exercises[0]?.version ?? 'authored 2026-05-10';

  return {
    moduleSlug,
    dataDirName,
    practiceSet: {
      topic: 'pyspark',
      title: `Fundamentals — ${label} (${level.charAt(0).toUpperCase() + level.slice(1)})`,
      description: `${label} fundamentals at ${level} depth. ${tasks.length} recognition exercises.`,
      version: trackVersion,
      metadata: {
        moduleId,
        trackLevel: level,
        estimatedDurationMinutes: totalMinutes,
        maximumDurationMinutes: Math.round(totalMinutes * 1.5),
        taskCount: tasks.length,
        scenarioCompany: 'GridUnion / NordGrid',
        modulePhase: `fundamentals_${level}`,
        taskTypeMix,
      },
      datasets,
      tasks,
    },
  };
}

function copyDatasets(srcDir, targetDataDir) {
  const srcDatasets = path.join(srcDir, 'datasets');
  if (!fs.existsSync(srcDatasets)) return;
  fs.mkdirSync(targetDataDir, { recursive: true });
  for (const file of fs.readdirSync(srcDatasets)) {
    fs.copyFileSync(path.join(srcDatasets, file), path.join(targetDataDir, file));
  }
}

function main() {
  let count = 0;
  const summary = [];
  for (const f of FOLDERS) {
    const srcDir = path.join(DOWNLOADS, f.dir);
    if (!fs.existsSync(srcDir)) {
      console.warn(`[skip] missing folder: ${srcDir}`);
      continue;
    }
    const { moduleSlug, dataDirName, practiceSet } = buildPracticeSet({
      ...f,
      srcDir,
    });
    const outFile = path.join(OUTPUT_DIR, `${moduleSlug}_Practice.json`);
    fs.writeFileSync(outFile, JSON.stringify(practiceSet, null, 2) + '\n', 'utf-8');
    copyDatasets(srcDir, path.join(OUTPUT_DIR, dataDirName));
    summary.push({ file: `${moduleSlug}_Practice.json`, tasks: practiceSet.tasks.length });
    count++;
  }
  console.log(`\nWrote ${count} PracticeSets:\n`);
  for (const s of summary) console.log(`  ${s.file.padEnd(40)} ${s.tasks} tasks`);
}

main();
