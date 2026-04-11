'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Copy, RotateCcw, Loader2, Check, Terminal } from 'lucide-react';
import { DataTablePreview } from './DataTablePreview';

/* ── Python syntax highlighter ──────────────────────────────────────────────── */

const PY_KEYWORDS = new Set([
  'False','None','True','and','as','assert','async','await','break','class',
  'continue','def','del','elif','else','except','finally','for','from','global',
  'if','import','in','is','lambda','nonlocal','not','or','pass','raise',
  'return','try','while','with','yield',
]);

const PY_BUILTINS = new Set([
  'print','len','range','type','int','float','str','list','dict','set','tuple',
  'bool','enumerate','zip','map','filter','sorted','reversed','sum','min','max',
  'abs','round','isinstance','hasattr','getattr','setattr','open','super','property',
]);

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightPython(code: string): string {
  // Process line by line to handle comments correctly
  return code.split('\n').map(line => {
    // Check for full-line comment
    const commentIdx = findCommentStart(line);
    const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
    const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

    let highlighted = highlightCodePart(codePart);
    if (commentPart) {
      highlighted += `<span style="color:var(--rm-code-comment,#6b7280)">${escapeHtml(commentPart)}</span>`;
    }
    return highlighted;
  }).join('\n');
}

function findCommentStart(line: string): number {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) return i;
  }
  return -1;
}

function highlightCodePart(code: string): string {
  // Tokenize and colorize
  return code.replace(
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*\b)|([^\s\w])/g,
    (match, str, num, word, op) => {
      if (str) return `<span style="color:var(--rm-code-string,#86efac)">${escapeHtml(str)}</span>`;
      if (num) return `<span style="color:var(--rm-code-number,#fbbf24)">${escapeHtml(num)}</span>`;
      if (word) {
        if (PY_KEYWORDS.has(word)) return `<span style="color:var(--rm-code-keyword,#c4b5fd)">${escapeHtml(word)}</span>`;
        if (PY_BUILTINS.has(word)) return `<span style="color:var(--rm-code-keyword,#c4b5fd);opacity:0.8">${escapeHtml(word)}</span>`;
        return escapeHtml(word);
      }
      return escapeHtml(match);
    }
  );
}

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface Dataset {
  id: string;
  file: string;
  description?: string;
}

interface Assertion {
  id: string;
  description: string;
  check: string;
}

interface ExpectedOutput {
  pattern: string;
  notes?: string;
}

interface PracticeCodeEditorProps {
  scaffold: string;
  language: string;
  datasets?: Dataset[];
  topic: string;
  initialCode?: string;
  onCodeChange?: (code: string) => void;
  readOnly?: boolean;
  assertions?: Assertion[];
  expectedOutput?: ExpectedOutput;
  checked?: boolean;
}

/* ── PySpark mock injected before user code ─────────────────────────────────── */

const PYSPARK_MOCK = `
# ── PySpark Mock (pandas-backed, browser execution) ──────────────────────────
import pandas as pd
import sys, types, io, math

class _MockConf:
    def __init__(self):
        self._conf = {}
    def get(self, key, default=None):
        return self._conf.get(key, default)
    def set(self, key, value):
        self._conf[key] = str(value)
        return self

class _MockColumn:
    def __init__(self, name):
        self._name = name
    def alias(self, a):
        return _MockColumn(a)
    def isNotNull(self):
        return self
    def isNull(self):
        return self
    def __ge__(self, other):
        return self
    def __gt__(self, other):
        return self
    def __le__(self, other):
        return self
    def __lt__(self, other):
        return self
    def __eq__(self, other):
        return self
    def __ne__(self, other):
        return self

class _MockDF:
    def __init__(self, pdf, _schema=None):
        self._pdf = pdf.copy()
        self._schema = _schema or self._build_schema(pdf)
    @property
    def columns(self):
        return list(self._pdf.columns)
    @property
    def schema(self):
        return self._schema
    @property
    def dtypes(self):
        return [(c, str(self._pdf[c].dtype)) for c in self._pdf.columns]
    def _build_schema(self, pdf):
        type_map = {
            'object': 'StringType()', 'string': 'StringType()',
            'float64': 'DoubleType()', 'float32': 'FloatType()',
            'int64': 'LongType()', 'int32': 'IntegerType()',
            'bool': 'BooleanType()',
        }
        fields = []
        for c in pdf.columns:
            dt = str(pdf[c].dtype)
            spark_type = type_map.get(dt, 'StringType()')
            nullable = bool(pdf[c].isna().any())
            fields.append(_MockStructField(c, spark_type, nullable))
        return _MockStructType(fields)
    def show(self, n=20, truncate=True):
        print(self._pdf.head(n).to_string(index=False))
    def count(self):
        return len(self._pdf)
    def printSchema(self):
        print(self._schema.treeString())
    def describe(self, *cols):
        target = self._pdf[list(cols)] if cols else self._pdf
        return _MockDF(target.describe().reset_index().rename(columns={'index': 'summary'}))
    def select(self, *cols):
        names = [c._name if hasattr(c, '_name') else c for c in cols]
        return _MockDF(self._pdf[names])
    def filter(self, cond):
        return self
    def where(self, cond):
        return self.filter(cond)
    def withColumn(self, name, col):
        pdf = self._pdf.copy()
        pdf[name] = None
        return _MockDF(pdf)
    def drop(self, *cols):
        names = [c._name if hasattr(c, '_name') else c for c in cols]
        return _MockDF(self._pdf.drop(columns=names, errors='ignore'))
    def orderBy(self, *cols, **kw):
        return self
    def sort(self, *cols, **kw):
        return self.orderBy(*cols, **kw)
    def groupBy(self, *cols):
        return _MockGrouped(self._pdf, cols)
    def limit(self, n):
        return _MockDF(self._pdf.head(n))
    def collect(self):
        return [_MockRow(dict(row)) for _, row in self._pdf.iterrows()]
    def head(self, n=1):
        rows = self._pdf.head(n)
        return [_MockRow(dict(r)) for _, r in rows.iterrows()]
    def take(self, n):
        return self.head(n)
    def toPandas(self):
        return self._pdf.copy()
    def explain(self, extended=False):
        print("== Physical Plan ==")
        print("*(mock) Scan pandas DataFrame")
    def cache(self):
        return self
    def persist(self, *a):
        return self
    def unpersist(self, *a):
        return self
    def repartition(self, n, *cols):
        return self
    def coalesce(self, n):
        return self
    def distinct(self):
        return _MockDF(self._pdf.drop_duplicates())
    def dropDuplicates(self, subset=None):
        return _MockDF(self._pdf.drop_duplicates(subset=subset))
    def union(self, other):
        return _MockDF(pd.concat([self._pdf, other._pdf], ignore_index=True))
    def join(self, other, on=None, how='inner'):
        return _MockDF(pd.merge(self._pdf, other._pdf, on=on, how=how))
    def na(self):
        return self
    @property
    def _jdf(self):
        return _MockJDF(self._schema)
    def __repr__(self):
        return f"DataFrame[{', '.join(self.columns)}]"

class _MockJDF:
    def __init__(self, schema):
        self._schema = schema
    def schema(self):
        return self._schema

class _MockRow:
    def __init__(self, data):
        self._data = data
    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        return self._data.get(name)
    def __getitem__(self, key):
        if isinstance(key, int):
            return list(self._data.values())[key]
        return self._data[key]
    def asDict(self):
        return dict(self._data)
    def __repr__(self):
        items = ', '.join(f"{k}={v!r}" for k, v in self._data.items())
        return f"Row({items})"

class _MockGrouped:
    def __init__(self, pdf, cols):
        self._pdf = pdf
        self._cols = [c._name if hasattr(c, '_name') else c for c in cols]
    def count(self):
        r = self._pdf.groupby(self._cols).size().reset_index(name='count')
        return _MockDF(r)
    def sum(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].sum().reset_index()
        return _MockDF(r)
    def avg(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].mean().reset_index()
        return _MockDF(r)
    def mean(self, *cols):
        return self.avg(*cols)
    def max(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].max().reset_index()
        return _MockDF(r)
    def min(self, *cols):
        r = self._pdf.groupby(self._cols)[list(cols)].min().reset_index()
        return _MockDF(r)
    def agg(self, *exprs):
        return self.count()

class _MockStructField:
    def __init__(self, name, dataType, nullable=True):
        self.name = name
        self.dataType = dataType
        self.nullable = nullable
    def __repr__(self):
        return f"StructField('{self.name}', {self.dataType}, {self.nullable})"

class _MockStructType:
    def __init__(self, fields=None):
        self.fields = fields or []
        self._field_map = {f.name: f for f in self.fields}
    def add(self, name, dataType, nullable=True):
        f = _MockStructField(name, dataType, nullable)
        self.fields.append(f)
        self._field_map[name] = f
        return self
    def __getitem__(self, key):
        return self._field_map[key]
    def __iter__(self):
        return iter(self.fields)
    def treeString(self):
        lines = ["root"]
        for f in self.fields:
            dt = f.dataType
            if isinstance(dt, str):
                dt_name = dt.replace('()', '').lower()
            else:
                dt_name = str(dt).replace('()', '').lower()
            lines.append(f" |-- {f.name}: {dt_name} (nullable = {str(f.nullable).lower()})")
        return "\\n".join(lines)
    def __repr__(self):
        return f"StructType([{', '.join(repr(f) for f in self.fields)}])"

class _MockReader:
    def __init__(self):
        self._options = {}
        self._schema = None
    def option(self, k, v):
        self._options[k] = v
        return self
    def schema(self, s):
        self._schema = s
        return self
    def csv(self, path, header=None, inferSchema=None, schema=None):
        opts = dict(self._options)
        if header is not None:
            opts['header'] = header
        if inferSchema is not None:
            opts['inferSchema'] = inferSchema
        use_header = str(opts.get('header', 'true')).lower() == 'true'
        sch = schema or self._schema
        pdf = pd.read_csv(path, header=0 if use_header else None)
        if sch and hasattr(sch, 'fields'):
            # Apply explicit schema types
            type_to_dtype = {
                'StringType()': 'object', 'DoubleType()': 'float64',
                'FloatType()': 'float32', 'IntegerType()': 'int32',
                'LongType()': 'int64', 'BooleanType()': 'bool',
            }
            for field in sch.fields:
                if field.name in pdf.columns:
                    target = type_to_dtype.get(str(field.dataType), None)
                    if target and target.startswith('float'):
                        pdf[field.name] = pd.to_numeric(pdf[field.name], errors='coerce')
                    elif target and target.startswith('int'):
                        pdf[field.name] = pd.to_numeric(pdf[field.name], errors='coerce')
            df = _MockDF(pdf, sch)
        else:
            df = _MockDF(pdf)
        self._options = {}
        self._schema = None
        return df
    def parquet(self, path):
        return _MockDF(pd.DataFrame({'_placeholder': []}))
    def json(self, path):
        return _MockDF(pd.read_json(path))

class _MockWriter:
    def __init__(self, df):
        self._df = df
        self._mode = 'error'
        self._options = {}
    def mode(self, m):
        self._mode = m
        return self
    def option(self, k, v):
        self._options[k] = v
        return self
    def csv(self, path, **kw):
        self._df._pdf.to_csv(path, index=False)
    def parquet(self, path, **kw):
        print(f"(mock) Would write parquet to {path}")
    def json(self, path, **kw):
        print(f"(mock) Would write json to {path}")
    def save(self, path=None, **kw):
        print(f"(mock) Would save to {path}")

_MockDF.write = property(lambda self: _MockWriter(self))

class _MockBuilder:
    def __init__(self):
        self._conf = _MockConf()
        self._name = 'app'
    def appName(self, n):
        b = _MockBuilder()
        b._conf = self._conf
        b._name = n
        b._conf.set('spark.app.name', n)
        return b
    def master(self, m):
        self._conf.set('spark.master', m)
        return self
    def config(self, k, v=None):
        if v is not None:
            self._conf.set(k, v)
        return self
    def enableHiveSupport(self):
        return self
    def getOrCreate(self):
        return _MockSession(self._conf, self._name)

class _MockSession:
    builder = _MockBuilder()
    def __init__(self, conf=None, name='app'):
        self.conf = conf or _MockConf()
        self.read = _MockReader()
        self.sparkContext = types.SimpleNamespace(
            setLogLevel=lambda l: None,
            appName=name,
        )
        self.catalog = types.SimpleNamespace(
            listDatabases=lambda: [],
            listTables=lambda db=None: [],
        )
    def createDataFrame(self, data, schema=None):
        if isinstance(schema, _MockStructType):
            col_names = [f.name for f in schema.fields]
            pdf = pd.DataFrame(data, columns=col_names)
            return _MockDF(pdf, schema)
        elif isinstance(schema, list):
            pdf = pd.DataFrame(data, columns=schema)
            return _MockDF(pdf)
        elif hasattr(data, 'columns'):
            return _MockDF(data)
        else:
            pdf = pd.DataFrame(data)
            return _MockDF(pdf)
    def sql(self, query):
        print(f"(mock) SQL not supported: {query}")
        return _MockDF(pd.DataFrame())
    def stop(self):
        pass
    def newSession(self):
        return self

# ── Wire up mock modules ────────────────────────────────────────────────────
_pyspark = types.ModuleType('pyspark')
_pyspark_sql = types.ModuleType('pyspark.sql')
_pyspark_sql.SparkSession = _MockSession
_pyspark_sql.DataFrame = _MockDF
_pyspark_sql.Row = _MockRow
_pyspark_sql_types = types.ModuleType('pyspark.sql.types')
_pyspark_sql_types.StructType = _MockStructType
_pyspark_sql_types.StructField = _MockStructField
_pyspark_sql_types.StringType = lambda: 'StringType()'
_pyspark_sql_types.DoubleType = lambda: 'DoubleType()'
_pyspark_sql_types.FloatType = lambda: 'FloatType()'
_pyspark_sql_types.IntegerType = lambda: 'IntegerType()'
_pyspark_sql_types.LongType = lambda: 'LongType()'
_pyspark_sql_types.BooleanType = lambda: 'BooleanType()'
_pyspark_sql_types.DateType = lambda: 'DateType()'
_pyspark_sql_types.TimestampType = lambda: 'TimestampType()'
_pyspark_sql_functions = types.ModuleType('pyspark.sql.functions')
_pyspark_sql_functions.col = _MockColumn
_pyspark_sql_functions.lit = lambda v: _MockColumn(f'lit({v})')
_pyspark_sql_functions.count = lambda c='*': _MockColumn('count')
_pyspark_sql_functions.sum = lambda c: _MockColumn('sum')
_pyspark_sql_functions.avg = lambda c: _MockColumn('avg')
_pyspark_sql_functions.mean = lambda c: _MockColumn('mean')
_pyspark_sql_functions.max = lambda c: _MockColumn('max')
_pyspark_sql_functions.min = lambda c: _MockColumn('min')
_pyspark_sql_functions.when = lambda cond, val: _MockColumn('when')
_pyspark_sql_functions.upper = lambda c: _MockColumn('upper')
_pyspark_sql_functions.lower = lambda c: _MockColumn('lower')
_pyspark_sql_functions.trim = lambda c: _MockColumn('trim')

sys.modules['pyspark'] = _pyspark
sys.modules['pyspark.sql'] = _pyspark_sql
sys.modules['pyspark.sql.types'] = _pyspark_sql_types
sys.modules['pyspark.sql.functions'] = _pyspark_sql_functions

# Alias for assertions that reference DataFrame directly
DataFrame = _MockDF
StructType = _MockStructType
StructField = _MockStructField

# ── End PySpark Mock ─────────────────────────────────────────────────────────
`.trim();

/* ── Pyodide loader ─────────────────────────────────────────────────────────── */

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  FS: {
    writeFile: (path: string, data: string) => void;
    mkdir: (path: string) => void;
    readdir: (path: string) => string[];
  };
  loadPackage: (pkg: string | string[]) => Promise<void>;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<PyodideInterface>;
  }
}

let pyodideInstance: PyodideInterface | null = null;
let pyodideLoadingPromise: Promise<PyodideInterface> | null = null;

function loadPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.loadPyodide) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `${PYODIDE_CDN}pyodide.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Pyodide script'));
    document.head.appendChild(script);
  });
}

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    await loadPyodideScript();
    const pyodide = await window.loadPyodide!({ indexURL: PYODIDE_CDN });
    await pyodide.loadPackage(['pandas', 'micropip']);
    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

/* ── Constants ──────────────────────────────────────────────────────────────── */

const ACCENT = '153,247,255';
const GREEN = '34,197,94';
const RED = '239,68,68';

/* ── Component ──────────────────────────────────────────────────────────────── */

export function PracticeCodeEditor({
  scaffold,
  language,
  datasets,
  topic,
  initialCode,
  onCodeChange,
  readOnly = false,
  assertions,
  expectedOutput,
  checked = false,
}: PracticeCodeEditorProps) {
  const [code, setCode] = useState(initialCode || scaffold);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Notify parent of code changes
  useEffect(() => {
    onCodeChange?.(code);
  }, [code, onCodeChange]);

  // Handle tab key for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newCode = code.substring(0, start) + '    ' + code.substring(end);
        setCode(newCode);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 4;
        });
      }
    },
    [code],
  );

  // Fetch full CSV content for code execution (all rows, raw text)
  const fetchFullCsv = useCallback(
    async (file: string): Promise<string> => {
      const params = new URLSearchParams({ topic, file, full: 'true' });
      const res = await fetch(`/api/operations/datasets?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch dataset: ${file}`);
      const json = await res.json();
      return json.rawCsv;
    },
    [topic],
  );

  const handleRun = useCallback(async () => {
    setRunning(true);
    setOutput(null);
    setError(null);

    try {
      // Load Pyodide if needed
      if (!pyodideReady) {
        setPyodideLoading(true);
      }
      const pyodide = await getPyodide();
      setPyodideReady(true);
      setPyodideLoading(false);

      // Write CSV datasets to virtual filesystem
      if (datasets && datasets.length > 0) {
        // Ensure directories exist
        const dirs = new Set<string>();
        for (const ds of datasets) {
          const parts = ds.file.split('/');
          if (parts.length > 1) {
            for (let i = 1; i <= parts.length - 1; i++) {
              dirs.add(parts.slice(0, i).join('/'));
            }
          }
        }
        for (const dir of dirs) {
          try {
            pyodide.FS.mkdir(dir);
          } catch {
            // Directory may already exist
          }
        }

        for (const ds of datasets) {
          const csvContent = await fetchFullCsv(ds.file);
          // Write using the file path from the dataset
          pyodide.FS.writeFile(ds.file, csvContent);

          // Also write with underscore naming convention (PS3_data_readings.csv)
          // so that scaffold code like `readings_path = 'PS3_data_readings.csv'` works
          const underscoreName = ds.file.replace(/\//g, '_');
          pyodide.FS.writeFile(underscoreName, csvContent);
        }
      }

      // Build the full code: mock + user code
      const isPySpark =
        language === 'python' &&
        (code.includes('pyspark') ||
          code.includes('SparkSession') ||
          code.includes('spark.read'));

      const fullCode = isPySpark ? `${PYSPARK_MOCK}\n\n${code}` : code;

      // Capture stdout
      await pyodide.runPythonAsync(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

      try {
        await pyodide.runPythonAsync(fullCode);
      } catch (pyErr: unknown) {
        // Still capture any stdout before the error
        const partialOut = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        const stderrOut = await pyodide.runPythonAsync('sys.stderr.getvalue()');

        // Reset stdout/stderr
        await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        const outStr = String(partialOut || '');
        const errStr = String(stderrOut || '');
        const pyMessage = pyErr instanceof Error ? pyErr.message : String(pyErr);

        // Clean up the error message — remove the mock preamble line numbers
        const cleanError = cleanPyodideError(pyMessage);

        if (outStr) setOutput(outStr);
        setError(errStr ? `${errStr}\n${cleanError}` : cleanError);
        return;
      }

      // Get captured output
      const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
      const stderr = await pyodide.runPythonAsync('sys.stderr.getvalue()');

      // Reset stdout/stderr
      await pyodide.runPythonAsync(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

      const outStr = String(stdout || '');
      const errStr = String(stderr || '');

      if (outStr) setOutput(outStr);
      if (errStr) setError(errStr);
      if (!outStr && !errStr) setOutput('(Code executed successfully with no output)');
    } catch (err) {
      setPyodideLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      setError(cleanPyodideError(msg));
    } finally {
      setRunning(false);
    }
  }, [code, datasets, language, topic, pyodideReady, fetchFullCsv]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [code]);

  const handleReset = useCallback(() => {
    setCode(scaffold);
    setOutput(null);
    setError(null);
  }, [scaffold]);

  const lineCount = code.split('\n').length;

  return (
    <div className="space-y-4">
      {/* Dataset previews */}
      {datasets && datasets.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--rm-text-secondary)' }}
          >
            Datasets
          </p>
          {datasets.map((ds) => (
            <DataTablePreview
              key={ds.id}
              topic={topic}
              file={ds.file}
              label={ds.description || ds.file}
            />
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px w-full" style={{ backgroundColor: 'var(--rm-border)' }} />

      {/* Editor header with buttons */}
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--rm-text-secondary)' }}
        >
          Your Code
        </p>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer"
              style={{
                color: 'var(--rm-text-secondary)',
                border: '1px solid var(--rm-border)',
                backgroundColor: 'transparent',
              }}
              title="Reset to starter scaffold"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer"
            style={{
              color: copied ? `rgb(${GREEN})` : 'var(--rm-text-secondary)',
              border: `1px solid ${copied ? `rgba(${GREEN},0.3)` : 'var(--rm-border)'}`,
              backgroundColor: copied ? `rgba(${GREEN},0.05)` : 'transparent',
            }}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {!readOnly && (
            <button
              onClick={handleRun}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              style={{
                color: running ? 'var(--rm-text-secondary)' : `rgb(${ACCENT})`,
                border: `1px solid ${running ? 'var(--rm-border)' : `rgba(${ACCENT},0.3)`}`,
                backgroundColor: running ? 'transparent' : `rgba(${ACCENT},0.08)`,
              }}
            >
              {running ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {pyodideLoading ? 'Loading Python...' : 'Executing...'}
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Run Code
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code textarea with line numbers */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          border: '1px solid var(--rm-border)',
          backgroundColor: 'var(--rm-code-bg, #0d1117)',
        }}
      >
        <div className="flex">
          {/* Line numbers */}
          <div
            className="select-none text-right pr-3 pl-4 py-5 font-mono text-[13px] leading-relaxed shrink-0"
            style={{
              color: 'var(--rm-text-secondary)',
              opacity: 0.3,
              borderRight: '1px solid var(--rm-border)',
            }}
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Editor with syntax highlighting overlay */}
          <div className="relative flex-1" style={{ minHeight: '200px' }}>
            {/* Highlighted code layer (visual) */}
            <pre
              className="absolute inset-0 font-mono text-[13px] leading-relaxed p-5 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
              aria-hidden
              style={{ color: 'var(--rm-code-text, #e2e8f0)' }}
              dangerouslySetInnerHTML={{ __html: highlightPython(code) + '\n' }}
            />
            {/* Textarea layer (input) */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => !readOnly && setCode(e.target.value)}
              onKeyDown={readOnly ? undefined : handleKeyDown}
              readOnly={readOnly}
              rows={Math.max(12, lineCount + 2)}
              className="relative z-10 w-full h-full font-mono text-[13px] leading-relaxed p-5 resize-y focus:outline-none"
              style={{
                backgroundColor: 'transparent',
                color: 'transparent',
                caretColor: 'var(--rm-code-text, #e2e8f0)',
                minHeight: '200px',
              }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      {/* Pyodide status indicator */}
      {!pyodideReady && !running && (
        <p
          className="text-[11px] flex items-center gap-1.5"
          style={{ color: 'var(--rm-text-secondary)', opacity: 0.5 }}
        >
          <Terminal className="h-3 w-3" />
          Python runtime will load on first run
        </p>
      )}

      {/* Output area */}
      {(output || error) && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: `1px solid ${error ? `rgba(${RED},0.2)` : `rgba(${GREEN},0.2)`}`,
            backgroundColor: error ? `rgba(${RED},0.03)` : `rgba(${GREEN},0.03)`,
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5"
            style={{
              borderBottom: `1px solid ${error ? `rgba(${RED},0.1)` : `rgba(${GREEN},0.1)`}`,
            }}
          >
            <Terminal className="h-3.5 w-3.5" style={{ color: error ? `rgb(${RED})` : `rgb(${GREEN})` }} />
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: error ? `rgb(${RED})` : `rgb(${GREEN})` }}
            >
              {error ? 'Error' : 'Output'}
            </span>
          </div>

          <div className="p-4 overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {output && (
              <pre
                className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ color: `rgb(${GREEN})` }}
              >
                {output}
              </pre>
            )}
            {error && (
              <pre
                className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                style={{ color: `rgb(${RED})` }}
              >
                {error}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Post-check: expected output and assertions */}
      {checked && (
        <div className="space-y-4" style={{ opacity: 0, animation: 'fadeSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          {expectedOutput && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--rm-callout-bg)',
                border: '1px solid var(--rm-callout-border)',
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: `rgb(${ACCENT})` }}
              >
                Expected Output
              </p>
              <pre
                className="font-mono text-[12px] whitespace-pre-wrap"
                style={{ color: 'var(--rm-text)' }}
              >
                {expectedOutput.pattern}
              </pre>
              {expectedOutput.notes && (
                <p
                  className="mt-2 text-[11px] italic"
                  style={{ color: 'var(--rm-text-secondary)' }}
                >
                  {expectedOutput.notes}
                </p>
              )}
            </div>
          )}

          {assertions && assertions.length > 0 && (
            <div
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--rm-bg-elevated)',
                border: '1px solid var(--rm-border)',
              }}
            >
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--rm-text-secondary)' }}
              >
                Self-Check Assertions
              </p>
              <div className="space-y-2">
                {assertions.map((a) => (
                  <div key={a.id} className="flex items-start gap-2">
                    <Check
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: `rgb(${GREEN})` }}
                    />
                    <div>
                      <p className="text-[12px]" style={{ color: 'var(--rm-text)' }}>
                        {a.description}
                      </p>
                      <code
                        className="text-[11px] font-mono"
                        style={{ color: 'var(--rm-text-secondary)' }}
                      >
                        {a.check}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

/**
 * Strip internal mock line references from Pyodide error messages
 * to avoid confusing users with mock infrastructure details.
 */
function cleanPyodideError(message: string): string {
  // Remove lines referencing <exec> with very high line numbers (from the mock preamble)
  const lines = message.split('\n');
  const filtered = lines.filter((line) => {
    // Keep all lines that aren't internal pyodide frame references to the mock
    const execMatch = line.match(/File "<exec>", line (\d+)/);
    if (execMatch) {
      const lineNum = parseInt(execMatch[1], 10);
      // The mock preamble is roughly 300 lines; if error is in that range, hide it
      // We show user-code errors (which start after the mock)
      if (lineNum < 10) return false; // Very early lines are definitely mock setup
    }
    return true;
  });

  return filtered.join('\n').trim();
}
