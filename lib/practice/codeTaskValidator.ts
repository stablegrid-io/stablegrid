/**
 * Auto-validation for write_the_code practice tasks.
 *
 * Parses the captured run output (printSchema + show) and compares it
 * against an `expectedOutput` spec defined on the task. Designed to be
 * tolerant: any field on the spec that is not provided is skipped, so a
 * task can opt into strict checks (schema + row count + every cell value)
 * or just spot-check what the author knows for sure.
 *
 * Returns 'unknown' when no usable spec is provided OR the output cannot
 * be parsed — the caller should fall back to self-review in that case.
 */
export type CodeValidationVerdict = 'success' | 'failure' | 'unknown';

export interface ExpectedOutputSpec {
  /**
   * Required column schema, in order. Type strings match what Spark's
   * `printSchema()` emits ("double", "long", "string", "integer", ...).
   * If omitted, schema is not validated.
   */
  schema?: Array<{ name: string; type: string }>;

  /**
   * Total number of data rows in `show()` output (excluding the header
   * row and the +---+ borders).
   */
  rowCount?: number;

  /**
   * Optional spot-check values. Each entry asserts that the cell at
   * `{row, col}` matches `value` (with `tolerance` for numeric matches —
   * absolute, not relative).
   */
  cellValues?: Array<{
    row: number;
    col: number | string; // column index or column name
    value: string | number;
    tolerance?: number;
  }>;

  /**
   * Optional set of values that must appear *somewhere* in the output, in
   * any order, regardless of position. Useful when row order is not
   * stable (groupBy without orderBy). Numeric values use a default
   * tolerance of 0.01 — pass `{value, tolerance}` to override per item.
   */
  requiredValues?: Array<string | number | { value: string | number; tolerance?: number }>;
}

export interface ParsedSparkOutput {
  schema: Array<{ name: string; type: string; nullable: boolean }>;
  /** Header row from show(), in order. */
  columns: string[];
  /** Data rows from show(), aligned to `columns`. Cells are raw strings. */
  rows: string[][];
}

export interface ValidationResult {
  verdict: CodeValidationVerdict;
  /** Human-readable diagnostic — surfaced to the UI / persisted alongside the attempt. */
  reasons: string[];
}

/* ── Parsers ───────────────────────────────────────────────────────────────── */

const SCHEMA_LINE_RE = /^\s*\|--\s*([^:]+?):\s*(\w+)\s*\(nullable\s*=\s*(true|false)\)\s*$/;

export function parseSparkPrintSchema(output: string): ParsedSparkOutput['schema'] {
  const lines = output.split('\n');
  const fields: ParsedSparkOutput['schema'] = [];
  let inSchema = false;
  for (const raw of lines) {
    const line = raw.replace(/ /g, ' ');
    if (/^\s*root\s*$/.test(line)) {
      inSchema = true;
      continue;
    }
    if (inSchema) {
      const match = line.match(SCHEMA_LINE_RE);
      if (match) {
        fields.push({ name: match[1].trim(), type: match[2].toLowerCase(), nullable: match[3] === 'true' });
      } else if (line.trim() === '' || /^\+|^[A-Za-z]/.test(line.trim())) {
        // Blank line OR start of show()/other content ends schema block.
        if (fields.length > 0) break;
      }
    }
  }
  return fields;
}

/**
 * Parse a Spark show()-style table.
 *
 * Looks for a block that opens with a `+---+` separator, a header row
 * `|col|col|`, another separator, N data rows, and a closing separator.
 */
export function parseSparkShow(output: string): { columns: string[]; rows: string[][] } | null {
  const lines = output.split('\n').map((l) => l.replace(/ /g, ' '));
  // Find the first separator line that starts with '+--' and treat it as the
  // top border. Spark show emits `+---+---+` runs, so a simple `^[+\-]` check
  // is enough to locate the table.
  const sepLineRe = /^\s*\+[-+]+\+\s*$/;
  const headerStart = lines.findIndex((l) => sepLineRe.test(l));
  if (headerStart === -1) return null;

  const headerLine = lines[headerStart + 1];
  if (!headerLine || !/^\s*\|/.test(headerLine)) return null;
  const sepAfterHeader = lines[headerStart + 2];
  if (!sepAfterHeader || !sepLineRe.test(sepAfterHeader)) return null;

  const columns = splitPipeRow(headerLine);

  const rows: string[][] = [];
  for (let i = headerStart + 3; i < lines.length; i += 1) {
    const line = lines[i];
    if (sepLineRe.test(line)) break;
    if (!/^\s*\|/.test(line)) break;
    rows.push(splitPipeRow(line));
  }
  return { columns, rows };
}

function splitPipeRow(line: string): string[] {
  // Strip leading/trailing pipes, then split. Cells are space-padded; trim.
  const inner = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return inner.split('|').map((c) => c.trim());
}

export function parseSparkOutput(output: string): ParsedSparkOutput | null {
  const schema = parseSparkPrintSchema(output);
  const showResult = parseSparkShow(output);
  if (!showResult && schema.length === 0) return null;
  return {
    schema,
    columns: showResult?.columns ?? [],
    rows: showResult?.rows ?? [],
  };
}

/* ── Comparator ────────────────────────────────────────────────────────────── */

const NUMERIC_RE = /^-?\d+(\.\d+)?(?:[eE][-+]?\d+)?$/;

function compareScalar(
  actual: string,
  expected: string | number,
  tolerance: number | undefined,
): boolean {
  if (typeof expected === 'number' || NUMERIC_RE.test(String(expected))) {
    const a = Number(actual);
    const e = Number(expected);
    if (!Number.isFinite(a) || !Number.isFinite(e)) return false;
    return Math.abs(a - e) <= (tolerance ?? 0);
  }
  // String compare — case-insensitive, whitespace-collapsed
  return (
    actual.replace(/\s+/g, ' ').trim().toLowerCase() ===
    String(expected).replace(/\s+/g, ' ').trim().toLowerCase()
  );
}

export function validateCodeOutput(
  rawOutput: string | null | undefined,
  spec: ExpectedOutputSpec | undefined,
): ValidationResult {
  if (!spec || (
    !spec.schema &&
    spec.rowCount === undefined &&
    !spec.cellValues &&
    !spec.requiredValues
  )) {
    return { verdict: 'unknown', reasons: ['No expectedOutput spec on this task.'] };
  }
  if (!rawOutput || rawOutput.trim().length === 0) {
    return { verdict: 'unknown', reasons: ['No output captured — run the code first.'] };
  }

  const parsed = parseSparkOutput(rawOutput);
  if (!parsed) {
    return {
      verdict: 'unknown',
      reasons: ['Could not parse output — expected printSchema() and show() blocks.'],
    };
  }

  const reasons: string[] = [];
  let ok = true;

  // Schema check — all fields in spec must appear with matching type, in order.
  if (spec.schema) {
    if (parsed.schema.length !== spec.schema.length) {
      ok = false;
      reasons.push(
        `Schema: expected ${spec.schema.length} column${spec.schema.length === 1 ? '' : 's'}, got ${parsed.schema.length}.`,
      );
    } else {
      for (let i = 0; i < spec.schema.length; i += 1) {
        const exp = spec.schema[i];
        const got = parsed.schema[i];
        if (got.name !== exp.name) {
          ok = false;
          reasons.push(`Schema #${i}: column name expected "${exp.name}", got "${got.name}".`);
        }
        if (got.type.toLowerCase() !== exp.type.toLowerCase()) {
          ok = false;
          reasons.push(`Schema #${i} (${exp.name}): type expected "${exp.type}", got "${got.type}".`);
        }
      }
    }
  }

  // Row count
  if (spec.rowCount !== undefined && parsed.rows.length !== spec.rowCount) {
    ok = false;
    reasons.push(`Row count: expected ${spec.rowCount}, got ${parsed.rows.length}.`);
  }

  // Cell-level spot checks
  if (spec.cellValues) {
    for (const cell of spec.cellValues) {
      const colIdx =
        typeof cell.col === 'number'
          ? cell.col
          : parsed.columns.findIndex((c) => c.toLowerCase() === String(cell.col).toLowerCase());
      const row = parsed.rows[cell.row];
      if (!row || colIdx < 0 || colIdx >= row.length) {
        ok = false;
        reasons.push(`Cell (${cell.row}, ${String(cell.col)}): out of range.`);
        continue;
      }
      const actual = row[colIdx];
      if (!compareScalar(actual, cell.value, cell.tolerance)) {
        ok = false;
        reasons.push(
          `Cell (${cell.row}, ${String(cell.col)}): expected ${JSON.stringify(cell.value)}, got "${actual}".`,
        );
      }
    }
  }

  // Required values — any-order spot checks
  if (spec.requiredValues) {
    const flat = parsed.rows.flat();
    for (const required of spec.requiredValues) {
      const value =
        typeof required === 'object' && required !== null && 'value' in required
          ? required.value
          : required;
      const tolerance =
        typeof required === 'object' && required !== null && 'tolerance' in required
          ? required.tolerance
          : 0.01;
      const found = flat.some((cell) => compareScalar(cell, value, tolerance));
      if (!found) {
        ok = false;
        reasons.push(`Required value ${JSON.stringify(value)} not present in output.`);
      }
    }
  }

  return { verdict: ok ? 'success' : 'failure', reasons };
}
