#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const MODELS_DIR = path.join(ROOT, 'public', 'grid-assets', 'models');
const TARGET_FILE_BYTES = 0.5 * 1024 * 1024;
const MAX_FILE_BYTES = 1.8 * 1024 * 1024;

const REQUIRED_MODELS = [
  'control-center.glb',
  'smart-transformer.glb',
  'solar-forecasting-array.glb',
  'battery-storage.glb',
  'frequency-controller.glb',
  'demand-response-system.glb',
  'grid-flywheel.glb',
  'hvdc-interconnector.glb',
  'ai-grid-optimizer.glb'
];

const failures = [];
const warnings = [];

for (const modelName of REQUIRED_MODELS) {
  const modelPath = path.join(MODELS_DIR, modelName);

  if (!fs.existsSync(modelPath)) {
    failures.push(`Missing required model: ${modelName}`);
    continue;
  }

  const stats = fs.statSync(modelPath);
  if (stats.size > MAX_FILE_BYTES) {
    failures.push(
      `Model too large: ${modelName} (${(stats.size / 1024 / 1024).toFixed(2)} MB > ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(2)} MB)`
    );
    continue;
  }

  if (stats.size > TARGET_FILE_BYTES) {
    warnings.push(
      `Model exceeds optimization target: ${modelName} (${(stats.size / 1024 / 1024).toFixed(2)} MB > ${(TARGET_FILE_BYTES / 1024 / 1024).toFixed(2)} MB target)`
    );
  }
}

if (failures.length > 0) {
  console.error('Grid asset validation failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn('Grid asset validation warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

console.log('Grid asset validation passed.');
