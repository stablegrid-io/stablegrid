/**
 * Tiny server-safe syntax highlighter for the topic-landing sample-lesson
 * card. Tokenizes line-by-line with simple regex grammars and emits HTML
 * strings (suitable for dangerouslySetInnerHTML).
 *
 * Languages supported:
 *  - python (keywords, builtins, strings, numbers, comments)
 *  - bash   (strings, numbers, # comments, $variables)
 *  - sql    (keywords, functions, strings, numbers, -- and /* comments)
 *  - text / unknown → escaped, no highlighting
 *
 * Color tokens reuse the reading-mode CSS vars (--rm-code-*) that the
 * practice editor already styles, so the same palette is applied across
 * marketing pages and the in-app editor without divergence.
 */

const KEYWORD = '--rm-code-keyword,#c4b5fd';
const STRING = '--rm-code-string,#86efac';
const NUMBER = '--rm-code-number,#fbbf24';
const COMMENT = '--rm-code-comment,#6b7280';
// Function-call color for calls like `.groupBy(`, `.agg(`, `avg(`. Uses a
// dedicated CSS var so themes can override; defaults to a soft sky-blue.
const FUNCTION_CALL = '--rm-code-function,#7dd3fc';
const BUILTIN_OPACITY = 0.8;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const span = (cssVar: string, text: string, extraStyle = ''): string =>
  `<span style="color:var(${cssVar})${extraStyle}">${escapeHtml(text)}</span>`;

/* ── Python ─────────────────────────────────────────────────────────────── */

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

function highlightPythonLine(line: string): string {
  // Pull the comment off first so strings don't get split mid-quote.
  const commentIdx = findPythonCommentStart(line);
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

  let highlighted = highlightPythonCode(codePart);
  if (commentPart) {
    highlighted += span(COMMENT, commentPart);
  }
  return highlighted;
}

function findPythonCommentStart(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '#' && !inSingle && !inDouble) return i;
  }
  return -1;
}

function highlightPythonCode(code: string): string {
  // Lookahead-aware tokenization: identifiers immediately followed by `(`
  // are colored as function calls (so `.groupBy(`, `avg(`, `.alias(` get
  // a tint), giving PySpark / pandas method-chain code visible structure
  // even when it contains no python keywords. The lookahead `(?=\()` is
  // captured by the FUNCTION_CALL alternative; all other identifiers
  // fall through to the keyword/builtin/plain branches.
  return code.replace(
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*)(?=\()|(\b[a-zA-Z_]\w*\b)|([^\s\w])/g,
    (match, str, num, fnCall, word) => {
      if (str) return span(STRING, str);
      if (num) return span(NUMBER, num);
      if (fnCall) {
        // Function-call ident: keywords and builtins still take precedence
        // (e.g. `print(`, `range(`) so they keep their canonical color.
        if (PY_KEYWORDS.has(fnCall)) return span(KEYWORD, fnCall);
        if (PY_BUILTINS.has(fnCall)) return span(KEYWORD, fnCall, `;opacity:${BUILTIN_OPACITY}`);
        return span(FUNCTION_CALL, fnCall);
      }
      if (word) {
        if (PY_KEYWORDS.has(word)) return span(KEYWORD, word);
        if (PY_BUILTINS.has(word)) return span(KEYWORD, word, `;opacity:${BUILTIN_OPACITY}`);
        return escapeHtml(word);
      }
      return escapeHtml(match);
    },
  );
}

/* ── SQL ────────────────────────────────────────────────────────────────── */

const SQL_KEYWORDS = new Set([
  'SELECT','FROM','WHERE','AND','OR','NOT','NULL','IS','IN','LIKE','BETWEEN',
  'JOIN','INNER','LEFT','RIGHT','OUTER','FULL','CROSS','ON','USING',
  'GROUP','BY','ORDER','HAVING','LIMIT','OFFSET','DISTINCT','AS','WITH',
  'INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','VIEW',
  'INDEX','ALTER','DROP','TRUNCATE','UNION','ALL','EXCEPT','INTERSECT',
  'CASE','WHEN','THEN','ELSE','END','OVER','PARTITION','ROWS','RANGE',
  'PRECEDING','FOLLOWING','UNBOUNDED','CURRENT','ROW','ASC','DESC',
  'IF','EXISTS','CAST','CONVERT','TRUE','FALSE','PRIMARY','KEY','FOREIGN',
  'REFERENCES','CONSTRAINT','DEFAULT','UNIQUE','CHECK','RECURSIVE',
]);

const SQL_FUNCTIONS = new Set([
  'COUNT','SUM','AVG','MIN','MAX','COALESCE','NULLIF','GREATEST','LEAST',
  'ROW_NUMBER','RANK','DENSE_RANK','LAG','LEAD','FIRST_VALUE','LAST_VALUE',
  'NTILE','PERCENT_RANK','CUME_DIST',
  'DATE','EXTRACT','DATE_TRUNC','NOW','CURRENT_DATE','CURRENT_TIMESTAMP',
  'CONCAT','SUBSTRING','TRIM','UPPER','LOWER','LENGTH','REPLACE','SPLIT_PART',
]);

function highlightSqlLine(line: string): string {
  // -- line comments
  const lineCommentIdx = findSqlLineCommentStart(line);
  if (lineCommentIdx >= 0) {
    const before = line.slice(0, lineCommentIdx);
    const after = line.slice(lineCommentIdx);
    return highlightSqlCode(before) + span(COMMENT, after);
  }
  return highlightSqlCode(line);
}

function findSqlLineCommentStart(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (ch === '-' && line[i + 1] === '-' && !inSingle && !inDouble) return i;
  }
  return -1;
}

function highlightSqlCode(code: string): string {
  return code.replace(
    /('[^']*')|(\b\d+\.?\d*\b)|(\b[a-zA-Z_]\w*\b)|([^\s\w])/g,
    (match, str, num, word) => {
      if (str) return span(STRING, str);
      if (num) return span(NUMBER, num);
      if (word) {
        const upper = word.toUpperCase();
        if (SQL_KEYWORDS.has(upper)) return span(KEYWORD, word);
        if (SQL_FUNCTIONS.has(upper)) return span(KEYWORD, word, `;opacity:${BUILTIN_OPACITY}`);
        return escapeHtml(word);
      }
      return escapeHtml(match);
    },
  );
}

/* ── Bash ───────────────────────────────────────────────────────────────── */

function highlightBashLine(line: string): string {
  // # comments. A leading # at start of line OR after whitespace counts;
  // # in the middle of a token (e.g. inside a path) is ignored — we only
  // accept # when preceded by whitespace or at column 0.
  const commentIdx = findBashCommentStart(line);
  const before = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const comment = commentIdx >= 0 ? line.slice(commentIdx) : '';

  let out = before.replace(
    /("[^"]*")|('[^']*')|(\$\{[^}]+\}|\$[A-Za-z_]\w*)|(\b\d+\.?\d*\b)/g,
    (match, dq, sq, varRef, num) => {
      if (dq) return span(STRING, dq);
      if (sq) return span(STRING, sq);
      if (varRef) return span(KEYWORD, varRef);
      if (num) return span(NUMBER, num);
      return escapeHtml(match);
    },
  );
  // Anything not matched by the regex needs escaping. Easiest: re-run the
  // replace via a single pass that escapes everything else inline. The
  // regex above only consumes matched ranges, so unmatched chars pass
  // through unescaped — we have to escape those too.
  out = escapeUnmatchedSegments(out);

  if (comment) out += span(COMMENT, comment);
  return out;
}

/**
 * After running the bash regex, the *unmatched* characters between
 * <span> blocks are still raw. Walk the string and escape any character
 * that's outside a <span> tag.
 */
function escapeUnmatchedSegments(html: string): string {
  let out = '';
  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      // copy tag verbatim until '>'
      const end = html.indexOf('>', i);
      if (end === -1) {
        out += escapeHtml(html.slice(i));
        break;
      }
      out += html.slice(i, end + 1);
      i = end + 1;
      // copy span body verbatim until closing </span>
      const closeIdx = html.indexOf('</span>', i);
      if (closeIdx === -1) {
        // shouldn't happen with our generated HTML, but bail safely
        out += html.slice(i);
        break;
      }
      out += html.slice(i, closeIdx + '</span>'.length);
      i = closeIdx + '</span>'.length;
    } else {
      const next = html.indexOf('<', i);
      const segment = next === -1 ? html.slice(i) : html.slice(i, next);
      out += escapeHtml(segment);
      i = next === -1 ? html.length : next;
    }
  }
  return out;
}

function findBashCommentStart(line: string): number {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) inSingle = !inSingle;
    else if (ch === '"' && !inSingle) inDouble = !inDouble;
    else if (
      ch === '#' &&
      !inSingle &&
      !inDouble &&
      (i === 0 || /\s/.test(line[i - 1]))
    ) {
      return i;
    }
  }
  return -1;
}

/* ── Public API ─────────────────────────────────────────────────────────── */

export function highlightCode(language: string, code: string): string {
  const lang = language.toLowerCase();
  const lines = code.split('\n');
  const highlightLine =
    lang === 'python' || lang === 'py'
      ? highlightPythonLine
      : lang === 'sql'
        ? highlightSqlLine
        : lang === 'bash' || lang === 'sh' || lang === 'shell'
          ? highlightBashLine
          : (line: string) => escapeHtml(line);
  return lines.map(highlightLine).join('\n');
}
