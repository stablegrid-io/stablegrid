#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootDir = process.cwd();
const envPath = path.join(rootDir, '.env.local');

const loadEnvFile = (filepath) => {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const raw = fs.readFileSync(filepath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const { data, error } = await supabase
  .from('product_funnel_report')
  .select(
    'step_order,event_name,step_label,session_count,identified_user_count,prior_step_session_count,step_to_step_conversion_pct,overall_conversion_pct'
  )
  .order('step_order', { ascending: true });

if (error) {
  console.error(error.message);
  process.exit(1);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(data ?? [], null, 2));
  process.exit(0);
}

if (!data || data.length === 0) {
  console.log('No funnel rows found.');
  process.exit(0);
}

const table = data.map((row) => ({
  step: `${row.step_order}. ${row.step_label}`,
  sessions: row.session_count,
  users: row.identified_user_count,
  prev: row.prior_step_session_count ?? '—',
  step_conv: row.step_to_step_conversion_pct === null ? '—' : `${row.step_to_step_conversion_pct}%`,
  overall_conv: row.overall_conversion_pct === null ? '—' : `${row.overall_conversion_pct}%`
}));

console.table(table);
