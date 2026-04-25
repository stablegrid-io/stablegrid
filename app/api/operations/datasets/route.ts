import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const PRACTICE_SETS_DIR = path.join(
  process.cwd(),
  'data',
  'operations',
  'practice-sets',
);

const CAPSTONE_DIR = path.join(process.cwd(), 'public', 'data', 'capstone');

const MAX_PREVIEW_ROWS = 20;

/**
 * GET /api/operations/datasets?topic=pyspark&file=PS3_data/readings.csv
 *
 * Serves a preview of a CSV dataset for practice sets.
 * Returns the first 20 rows as JSON: { headers: string[], rows: string[][] }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const topic = searchParams.get('topic');
  const file = searchParams.get('file');
  const full = searchParams.get('full') === 'true';

  if (!topic || !file) {
    return NextResponse.json(
      { error: 'Missing required query parameters: topic, file' },
      { status: 400 },
    );
  }

  // Validate: file must end in .csv or .json
  if (!file.endsWith('.csv') && !file.endsWith('.json')) {
    return NextResponse.json(
      { error: 'Only .csv and .json files are supported' },
      { status: 400 },
    );
  }

  // Resolve and validate path to prevent traversal
  const resolved = path.resolve(PRACTICE_SETS_DIR, topic, file);
  const normalizedBase = path.resolve(PRACTICE_SETS_DIR);

  if (!resolved.startsWith(normalizedBase + path.sep)) {
    return NextResponse.json(
      { error: 'Invalid file path' },
      { status: 400 },
    );
  }

  try {
    let raw: string;
    try {
      raw = await fs.readFile(resolved, 'utf-8');
    } catch {
      // Try alternative path: PS3_data_readings.csv → PS3_data/readings.csv
      const altFile = file.replace(/^([A-Z0-9]+_data)_/, '$1/');
      const altResolved = path.resolve(PRACTICE_SETS_DIR, topic, altFile);
      if (altResolved.startsWith(normalizedBase + path.sep)) {
        try {
          raw = await fs.readFile(altResolved, 'utf-8');
        } catch {
          raw = '';
        }
      } else {
        raw = '';
      }

      // Fallback: try capstone directories (e.g. public/data/capstone/pyspark-junior/)
      if (!raw) {
        const normalizedCapstone = path.resolve(CAPSTONE_DIR);
        const capstoneGlobs = [
          path.resolve(CAPSTONE_DIR, `${topic}-junior`, file),
          path.resolve(CAPSTONE_DIR, `${topic}-mid`, file),
          path.resolve(CAPSTONE_DIR, `${topic}-senior`, file),
        ];
        let found = false;
        for (const cp of capstoneGlobs) {
          if (!cp.startsWith(normalizedCapstone + path.sep)) continue;
          try {
            raw = await fs.readFile(cp, 'utf-8');
            found = true;
            break;
          } catch {
            /* try next */
          }
        }
        if (!found) {
          const err = new Error('ENOENT') as NodeJS.ErrnoException;
          err.code = 'ENOENT';
          throw err;
        }
      }
    }
    // Handle JSON files
    if (file.endsWith('.json')) {
      if (full) {
        return NextResponse.json({ rawJson: raw });
      }
      const parsed = JSON.parse(raw);
      const records = Array.isArray(parsed) ? parsed : [parsed];
      const headers = records.length > 0 ? Object.keys(records[0]) : [];
      const rows = records.slice(0, MAX_PREVIEW_ROWS).map((r) =>
        headers.map((h) => String(r[h] ?? '')),
      );
      return NextResponse.json({
        headers,
        rows,
        totalRows: records.length,
        previewRows: rows.length,
      });
    }

    const lines = raw.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'CSV file is empty' },
        { status: 400 },
      );
    }

    const headers = parseCsvLine(lines[0]);

    // When full=true, return raw CSV text for code execution
    if (full) {
      return NextResponse.json({
        headers,
        rawCsv: raw,
        totalRows: lines.length - 1,
      });
    }

    const rows = lines
      .slice(1, 1 + MAX_PREVIEW_ROWS)
      .map((line) => parseCsvLine(line));

    return NextResponse.json({
      headers,
      rows,
      totalRows: lines.length - 1,
      previewRows: rows.length,
    });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'code' in err &&
      (err as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return NextResponse.json(
        { error: 'Dataset file not found' },
        { status: 404 },
      );
    }
    console.error('Dataset API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Simple CSV line parser that handles quoted fields.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}
