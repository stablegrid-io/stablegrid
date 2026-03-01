#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DUPLICATE_LESSON_PREFIX_REGEX = /^lesson\s*\d+\s*:\s*lesson\s*\d+\s*:/i;
const LESSON_PREFIX_REGEX = /^lesson\s*(\d+)\s*:\s*/i;
const LESSON_OR_PART_PREFIX_REGEX = /^(?:lesson|part)\s*\d+\s*:\s*/i;
const MODULE_HEADER_REGEX = /^module\s*(\d+)\s*:?\s*$/i;
const MODULE_PREFIX_REGEX = /^module\s*(\d+)\s*:\s*/i;
const PART_HEADER_REGEX = /^part\s*(\d+)\s*:\s*(.+)$/i;
const WELCOME_HEADER_REGEX = /^welcome to module\s*(\d+)$/i;
const CHECKPOINT_HEADER_REGEX = /^module\s*(\d+)\s*checkpoint$/i;
const ESTIMATED_TIME_REGEX = /^estimated time\s*:\s*(\d+)\s*minutes?$/i;
const MODULE_OBJECTIVE_REGEX = /^module objective\s*:\s*(.+)$/i;
const DEFAULT_LESSON_MINUTES = 20;

const decodeXmlEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const slugify = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const parseArgs = (argv) => {
  const args = {
    command: argv[2] ?? '',
    options: {}
  };

  for (let index = 3; index < argv.length; index += 1) {
    const raw = argv[index];
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const value = argv[index + 1]?.startsWith('--') ? '' : argv[index + 1];
    if (value !== undefined && value !== '') {
      index += 1;
    }

    if (args.options[key] === undefined) {
      args.options[key] = value ?? true;
    } else if (Array.isArray(args.options[key])) {
      args.options[key].push(value ?? true);
    } else {
      args.options[key] = [args.options[key], value ?? true];
    }
  }

  return args;
};

const asArray = (value) => {
  if (value === undefined) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
};

const naturalSortByModule = (files) => {
  const moduleNumber = (filePath) => {
    const base = path.basename(filePath);
    const match = base.match(/module[\s_-]*(\d+)/i);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  return [...files].sort((left, right) => {
    const leftNum = moduleNumber(left);
    const rightNum = moduleNumber(right);
    if (leftNum !== rightNum) return leftNum - rightNum;
    return left.localeCompare(right);
  });
};

const listDocxFiles = ({ input, inputDir }) => {
  const directInputs = asArray(input).map((entry) => path.resolve(entry));
  const fromDir =
    typeof inputDir === 'string'
      ? fs
          .readdirSync(path.resolve(inputDir), { withFileTypes: true })
          .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.docx'))
          .map((entry) => path.resolve(inputDir, entry.name))
      : [];

  const merged = [...directInputs, ...fromDir];
  if (merged.length === 0) {
    throw new Error('No DOCX files provided. Use --input or --input-dir.');
  }

  const existing = merged.filter((filePath) => fs.existsSync(filePath));
  if (existing.length !== merged.length) {
    const missing = merged.filter((filePath) => !fs.existsSync(filePath));
    throw new Error(`DOCX files not found:\n${missing.join('\n')}`);
  }

  return naturalSortByModule(existing);
};

const normalizeInlineText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();

const getNormalizedLines = (value) =>
  String(value ?? '')
    .split('\n')
    .map((line) => normalizeInlineText(line))
    .filter(Boolean);

const normalizeDocxText = (value) =>
  String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/\f/g, '\n\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2007/g, ' ')
    .replace(/\t/g, '  ');

const splitIntoParagraphs = (value) => {
  const lines = normalizeDocxText(value).split('\n');
  const paragraphs = [];
  let current = [];

  const flush = () => {
    while (current.length > 0 && current[0].trim().length === 0) {
      current.shift();
    }
    while (current.length > 0 && current[current.length - 1].trim().length === 0) {
      current.pop();
    }
    if (current.length === 0) {
      current = [];
      return;
    }

    paragraphs.push(current.map((line) => line.replace(/\s+$/g, '')).join('\n'));
    current = [];
  };

  lines.forEach((line) => {
    if (line.trim().length === 0) {
      flush();
      return;
    }
    current.push(line);
  });

  flush();
  return paragraphs;
};

const extractParagraphsFromDocxViaTextutil = (docxPath) => {
  const text = execFileSync('textutil', ['-convert', 'txt', '-stdout', docxPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  return splitIntoParagraphs(text);
};

const extractParagraphsFromDocxViaXml = (docxPath) => {
  const xml = execFileSync('unzip', ['-p', docxPath, 'word/document.xml'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const paragraphMatches = xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) ?? [];
  return paragraphMatches
    .map((paragraphXml) => {
      const textRuns = paragraphXml.match(/<w:t[^>]*>[\s\S]*?<\/w:t>/g) ?? [];
      const line = textRuns
        .map((run) =>
          decodeXmlEntities(
            run.replace(/^<w:t[^>]*>/, '').replace(/<\/w:t>$/, '')
          )
        )
        .join('');
      return normalizeInlineText(line);
    })
    .filter((line) => line.length > 0);
};

const extractParagraphsFromDocx = (docxPath) => {
  try {
    const paragraphs = extractParagraphsFromDocxViaTextutil(docxPath);
    if (paragraphs.length > 0) {
      return paragraphs;
    }
  } catch (error) {
    const textutilMessage = error instanceof Error ? error.message : String(error);
    try {
      const paragraphs = extractParagraphsFromDocxViaXml(docxPath);
      if (paragraphs.length > 0) {
        return paragraphs;
      }
    } catch (fallbackError) {
      const unzipMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(
        `Failed to extract "${docxPath}". Tried textutil and unzip.\ntextutil: ${textutilMessage}\nunzip: ${unzipMessage}`
      );
    }
  }

  return extractParagraphsFromDocxViaXml(docxPath);
};

const parseModuleOrder = (paragraphs, filePath, fallbackOrder) => {
  const fromFile = path.basename(filePath).match(/module[\s_-]*(\d+)/i);
  if (fromFile) {
    return Number(fromFile[1]);
  }

  const fromHeader = paragraphs
    .slice(0, 6)
    .flatMap((paragraph) => getNormalizedLines(paragraph))
    .map((line) => line.match(MODULE_HEADER_REGEX))
    .find((match) => Boolean(match));
  if (fromHeader) {
    return Number(fromHeader[1]);
  }

  return fallbackOrder;
};

const stripPrefix = (title, regex) => title.replace(regex, '').trim();

const normalizeLessonTitle = (rawTitle, order) => {
  const withoutPrefix =
    stripPrefix(rawTitle, LESSON_OR_PART_PREFIX_REGEX) || normalizeInlineText(rawTitle);
  return `Lesson ${order}: ${withoutPrefix}`;
};

const parseMinutesFromLine = (line) => {
  const match = normalizeInlineText(line).match(/(\d+)\s*(?:min|minutes?)\b/i);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
};

const countWords = (value) => {
  const normalized = normalizeInlineText(value);
  if (!normalized) return 0;
  return normalized.split(' ').filter(Boolean).length;
};

const buildModuleTitleAndDescription = ({
  moduleOrder,
  titleLines,
  objective,
  filePath
}) => {
  const normalizedTitleLines = titleLines
    .map((line) => normalizeInlineText(line))
    .filter(Boolean)
    .map((line) => stripPrefix(line, MODULE_PREFIX_REGEX));

  let titleBody = normalizedTitleLines[0] ?? `Imported Module ${moduleOrder}`;
  let subtitle = '';

  if (normalizedTitleLines.length > 1) {
    const continuation =
      /[&,:/-]$/.test(titleBody) || /\b(?:and|or|of|for|to|with)$/i.test(titleBody);
    if (continuation) {
      titleBody = normalizeInlineText(`${titleBody} ${normalizedTitleLines[1]}`);
      subtitle = normalizedTitleLines.slice(2).join(' ');
    } else {
      subtitle = normalizedTitleLines.slice(1).join(' ');
    }
  }

  const description =
    [subtitle, objective]
      .map((entry) => normalizeInlineText(entry))
      .filter(Boolean)
      .join(' ') ||
    `${titleBody} imported from ${path.basename(filePath)}.`;

  return {
    title: `Module ${moduleOrder}: ${titleBody}`,
    description
  };
};

const parseSectionMarker = (paragraph, moduleOrder) => {
  const normalized = normalizeInlineText(paragraph);
  const partMatch = normalized.match(PART_HEADER_REGEX);
  if (partMatch) {
    return {
      kind: 'part',
      title: partMatch[2].trim()
    };
  }

  const welcomeMatch = normalized.match(WELCOME_HEADER_REGEX);
  if (welcomeMatch && Number(welcomeMatch[1]) === moduleOrder) {
    return {
      kind: 'welcome',
      title: 'Welcome and Overview'
    };
  }

  const checkpointMatch = normalized.match(CHECKPOINT_HEADER_REGEX);
  if (checkpointMatch && Number(checkpointMatch[1]) === moduleOrder) {
    return {
      kind: 'checkpoint',
      title: 'Module Checkpoint'
    };
  }

  return null;
};

const splitModuleIntoSections = (paragraphs, moduleOrder) => {
  const sections = [];
  const introParagraphs = [];
  let current = null;

  paragraphs.forEach((paragraph) => {
    const marker = parseSectionMarker(paragraph, moduleOrder);
    if (marker) {
      if (current) {
        sections.push(current);
      }
      current = {
        title: marker.title,
        kind: marker.kind,
        paragraphs: []
      };
      return;
    }

    if (current) {
      current.paragraphs.push(paragraph);
      return;
    }

    introParagraphs.push(paragraph);
  });

  if (current) {
    sections.push(current);
  }

  const normalizedSections = [];
  if (introParagraphs.length > 0) {
    normalizedSections.push({
      title: 'Module Overview',
      kind: 'intro',
      paragraphs: introParagraphs
    });
  }

  normalizedSections.push(...sections);

  const filtered = normalizedSections.filter(
    (section) =>
      section.paragraphs.some((paragraph) => normalizeInlineText(paragraph).length > 0) ||
      section.kind === 'checkpoint'
  );

  if (filtered.length > 0) {
    return filtered;
  }

  return [
    {
      title: 'Imported Lesson',
      kind: 'fallback',
      paragraphs: paragraphs.length > 0 ? paragraphs : ['Imported lesson content.']
    }
  ];
};

const getParagraphLines = (paragraph) =>
  String(paragraph ?? '')
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .filter((line) => line.trim().length > 0);

const isBulletLine = (line) => /^[•*-]\s+/.test(line.trim());
const isNumberedLine = (line) => /^\d+[.)]\s+/.test(line.trim());

const looksLikeListParagraph = (paragraph) => {
  const lines = getParagraphLines(paragraph);
  if (lines.length < 2) {
    return null;
  }

  if (lines.every(isBulletLine)) {
    return 'bullet-list';
  }
  if (lines.every(isNumberedLine)) {
    return 'numbered-list';
  }

  return null;
};

const stripListPrefix = (line) =>
  line.trim().replace(/^(?:[•*-]|\d+[.)])\s+/, '').trim();

const looksLikeHeadingParagraph = (paragraph) => {
  const lines = getParagraphLines(paragraph);
  if (lines.length !== 1) {
    return false;
  }

  const text = normalizeInlineText(lines[0]);
  if (!text) {
    return false;
  }

  if (
    MODULE_HEADER_REGEX.test(text) ||
    PART_HEADER_REGEX.test(text) ||
    WELCOME_HEADER_REGEX.test(text) ||
    CHECKPOINT_HEADER_REGEX.test(text) ||
    ESTIMATED_TIME_REGEX.test(text) ||
    MODULE_OBJECTIVE_REGEX.test(text)
  ) {
    return false;
  }

  if (text.length > 90 || /[.!?]$/.test(text) || /^#/.test(text)) {
    return false;
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length > 12) {
    return false;
  }

  if (/:$/.test(text)) {
    return true;
  }

  return words.every((word) => {
    const cleaned = word.replace(/^[("']+|[)"':,.;-]+$/g, '');
    if (!cleaned) {
      return true;
    }
    if (/^(?:and|or|of|for|to|with|the|a|an|in|on|at|vs)$/i.test(cleaned)) {
      return true;
    }
    return /^[A-Z0-9]/.test(cleaned);
  });
};

const detectCodeLineType = (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  if (
    /^(spark-submit|pip |python(?:3)? |cd |zip\b|mkdir\b|export |docker\b|kubectl\b|airflow\b|dbt\b|aws\b|gcloud\b|az\b)/i.test(
      trimmed
    ) ||
    /^--[a-z0-9-]+/i.test(trimmed)
  ) {
    return 'bash';
  }

  if (
    /^(select\b|with\b.+\bas\b|create\b|merge\b|insert\b|delete\b|update\b)/i.test(
      trimmed
    )
  ) {
    return 'sql';
  }

  if (
    /^#/.test(trimmed) ||
    /^(from \w|import \w|def \w+\(|class \w+|if __name__|elif\b.+:|else:|for\b.+\bin\b.+:|while\b.+:|try:|except\b|finally:|return\b|raise\b|yield\b|@[\w.]+)/.test(
      trimmed
    ) ||
    /^[A-Za-z_][A-Za-z0-9_]*\s*=/.test(trimmed) ||
    /^spark\./.test(trimmed) ||
    /\\$/.test(trimmed)
  ) {
    return 'python';
  }

  return null;
};

const looksLikeCodeParagraph = (paragraph) => {
  const lines = getParagraphLines(paragraph);
  if (lines.length === 0) {
    return false;
  }

  const codeTypes = lines.map(detectCodeLineType).filter(Boolean);
  if (codeTypes.length === 0) {
    return false;
  }

  return (
    codeTypes.length >= Math.max(2, Math.ceil(lines.length * 0.6)) ||
    Boolean(detectCodeLineType(lines[0]))
  );
};

const detectCodeLanguage = (paragraphs) => {
  const firstCodeType = paragraphs
    .flatMap((paragraph) => getParagraphLines(paragraph))
    .map(detectCodeLineType)
    .find(Boolean);

  return firstCodeType ?? 'text';
};

const looksLikeDiagramParagraph = (paragraph) => {
  const lines = getParagraphLines(paragraph);
  if (lines.length < 2) {
    return false;
  }

  const codeLikeLines = lines.filter((line) => Boolean(detectCodeLineType(line))).length;
  const structuralLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      /\[[^\]]+\]/.test(trimmed) ||
      /(?:->|-->|←|→|↑|↓)/.test(trimmed) ||
      /^[+\-|]{2,}/.test(trimmed) ||
      /\S {2,}\S/.test(line) ||
      /^[A-Z][A-Z0-9 _()/.-]+:\s*$/.test(trimmed)
    );
  }).length;
  const shortLines = lines.filter((line) => normalizeInlineText(line).length <= 60).length;

  return (
    (structuralLines >= 2 && codeLikeLines < Math.ceil(lines.length / 2)) ||
    (shortLines >= Math.ceil(lines.length * 0.75) &&
      lines.some((line) => /\S {2,}\S/.test(line)) &&
      codeLikeLines < Math.ceil(lines.length / 3))
  );
};

const toParagraphText = (paragraph) => normalizeInlineText(paragraph.replace(/\n+/g, ' '));

const buildBlocksFromParagraphs = (paragraphs) => {
  const blocks = [];

  for (let index = 0; index < paragraphs.length; ) {
    const paragraph = paragraphs[index];
    if (!normalizeInlineText(paragraph)) {
      index += 1;
      continue;
    }

    const lines = getParagraphLines(paragraph);
    const firstListIndex = lines.findIndex(
      (line) => isBulletLine(line) || isNumberedLine(line)
    );
    if (firstListIndex >= 0) {
      const listLines = lines.slice(firstListIndex);
      const listKind =
        listLines.length >= 2
          ? listLines.every(isBulletLine)
            ? 'bullet-list'
            : listLines.every(isNumberedLine)
              ? 'numbered-list'
              : null
          : null;
      if (listKind) {
        const introLines = lines.slice(0, firstListIndex);
        if (introLines.length > 0) {
          blocks.push({
            type: 'paragraph',
            content: normalizeInlineText(introLines.join(' '))
          });
        }
        blocks.push({
          type: listKind,
          items: listLines.map(stripListPrefix)
        });
        index += 1;
        continue;
      }
    }

    const listType = looksLikeListParagraph(paragraph);
    if (listType) {
      blocks.push({
        type: listType,
        items: getParagraphLines(paragraph).map(stripListPrefix)
      });
      index += 1;
      continue;
    }

    if (looksLikeCodeParagraph(paragraph)) {
      const codeParagraphs = [paragraph];
      let nextIndex = index + 1;
      while (nextIndex < paragraphs.length && looksLikeCodeParagraph(paragraphs[nextIndex])) {
        codeParagraphs.push(paragraphs[nextIndex]);
        nextIndex += 1;
      }

      blocks.push({
        type: 'code',
        language: detectCodeLanguage(codeParagraphs),
        content: codeParagraphs.join('\n\n')
      });
      index = nextIndex;
      continue;
    }

    if (looksLikeDiagramParagraph(paragraph)) {
      const diagramParagraphs = [paragraph];
      let nextIndex = index + 1;
      while (
        nextIndex < paragraphs.length &&
        looksLikeDiagramParagraph(paragraphs[nextIndex]) &&
        !looksLikeCodeParagraph(paragraphs[nextIndex])
      ) {
        diagramParagraphs.push(paragraphs[nextIndex]);
        nextIndex += 1;
      }

      blocks.push({
        type: 'diagram',
        content: diagramParagraphs.join('\n\n')
      });
      index = nextIndex;
      continue;
    }

    if (looksLikeHeadingParagraph(paragraph)) {
      const headingText = toParagraphText(paragraph);
      blocks.push({
        type: countWords(headingText) <= 6 ? 'heading' : 'subheading',
        content: headingText
      });
      index += 1;
      continue;
    }

    blocks.push({
      type: 'paragraph',
      content: toParagraphText(paragraph)
    });
    index += 1;
  }

  return blocks.length > 0
    ? blocks
    : [
        {
          type: 'paragraph',
          content: 'Imported lesson content.'
        }
      ];
};

const allocateLessonMinutes = (sections, totalMinutes) => {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return sections.map(() => DEFAULT_LESSON_MINUTES);
  }

  if (sections.length === 1) {
    return [Math.max(1, Math.round(totalMinutes))];
  }

  const weights = sections.map((section) =>
    Math.max(
      1,
      countWords(
        section.paragraphs
          .map((paragraph) => toParagraphText(paragraph))
          .join(' ')
      )
    )
  );
  const minimumPerLesson = totalMinutes >= sections.length * 5 ? 5 : 1;
  const allocations = sections.map(() => minimumPerLesson);
  const distributable = Math.max(0, totalMinutes - minimumPerLesson * sections.length);
  if (distributable === 0) {
    return allocations;
  }

  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0) || sections.length;
  const rawExtras = weights.map((weight) => (distributable * weight) / weightTotal);
  const floored = rawExtras.map((value) => Math.floor(value));
  let remaining = distributable - floored.reduce((sum, value) => sum + value, 0);

  floored.forEach((value, index) => {
    allocations[index] += value;
  });

  const rankedByFraction = rawExtras
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((left, right) => right.fraction - left.fraction);

  for (let rank = 0; rank < rankedByFraction.length && remaining > 0; rank += 1) {
    allocations[rankedByFraction[rank].index] += 1;
    remaining -= 1;
  }

  return allocations;
};

const parseModuleFromParagraphs = ({ lines, filePath, fallbackOrder }) => {
  const paragraphs = lines.filter((paragraph) => normalizeInlineText(paragraph).length > 0);
  const moduleOrder = parseModuleOrder(paragraphs, filePath, fallbackOrder);
  const moduleHeaderIndex = paragraphs.findIndex((paragraph) =>
    getNormalizedLines(paragraph).some((line) => MODULE_HEADER_REGEX.test(line))
  );

  const titleLines = [];
  let cursor = moduleHeaderIndex >= 0 ? moduleHeaderIndex : 0;
  if (moduleHeaderIndex >= 0) {
    const headerLines = getNormalizedLines(paragraphs[moduleHeaderIndex]);
    const headerLineIndex = headerLines.findIndex((line) => MODULE_HEADER_REGEX.test(line));
    titleLines.push(...headerLines.slice(headerLineIndex + 1));
    cursor = moduleHeaderIndex + 1;
  }

  while (cursor < paragraphs.length) {
    const paragraphLines = getNormalizedLines(paragraphs[cursor]);
    if (
      paragraphLines.length === 0 ||
      paragraphLines.some((line) => ESTIMATED_TIME_REGEX.test(line)) ||
      paragraphLines.some((line) => MODULE_OBJECTIVE_REGEX.test(line)) ||
      paragraphLines.some((line) => parseSectionMarker(line, moduleOrder))
    ) {
      break;
    }

    titleLines.push(...paragraphLines);
    cursor += 1;
  }

  let moduleEstimatedMinutes = null;
  let moduleObjective = '';
  while (cursor < paragraphs.length) {
    const paragraphLines = getNormalizedLines(paragraphs[cursor]);
    const estimatedMatch = paragraphLines
      .map((line) => line.match(ESTIMATED_TIME_REGEX))
      .find(Boolean);
    if (estimatedMatch) {
      moduleEstimatedMinutes = Number(estimatedMatch[1]);
    }

    const objectiveMatch = paragraphLines
      .map((line) => line.match(MODULE_OBJECTIVE_REGEX))
      .find(Boolean);
    if (objectiveMatch) {
      moduleObjective = objectiveMatch[1].trim();
    }

    const containsOnlyMetadata =
      paragraphLines.length > 0 &&
      paragraphLines.every(
        (line) => ESTIMATED_TIME_REGEX.test(line) || MODULE_OBJECTIVE_REGEX.test(line)
      );
    if (!containsOnlyMetadata) {
      break;
    }

    cursor += 1;
  }

  const bodyParagraphs = paragraphs.slice(cursor);
  const moduleMeta = buildModuleTitleAndDescription({
    moduleOrder,
    titleLines,
    objective: moduleObjective,
    filePath
  });
  const sectionSeeds = splitModuleIntoSections(bodyParagraphs, moduleOrder);
  const lessonMinutes = allocateLessonMinutes(
    sectionSeeds,
    moduleEstimatedMinutes ?? sectionSeeds.length * DEFAULT_LESSON_MINUTES
  );

  const lessons = sectionSeeds.map((section, lessonIndex) => ({
    order: lessonIndex + 1,
    title: normalizeLessonTitle(section.title, lessonIndex + 1),
    estimatedMinutes: lessonMinutes[lessonIndex],
    blocks: buildBlocksFromParagraphs(section.paragraphs)
  }));

  const totalMinutes = lessons.reduce(
    (sum, lesson) => sum + (Number(lesson.estimatedMinutes) || 0),
    0
  );

  return {
    order: moduleOrder,
    title: moduleMeta.title,
    description: moduleMeta.description,
    lessons,
    totalMinutes
  };
};

const buildNormalizedTheoryDoc = ({ topic, title, description, sourceFiles }) => {
  const parsedModules = sourceFiles.map((filePath, index) => {
    const paragraphs = extractParagraphsFromDocx(filePath);
    return parseModuleFromParagraphs({
      lines: paragraphs,
      filePath,
      fallbackOrder: index + 1
    });
  });

  const modules = [...parsedModules].sort((left, right) => left.order - right.order);
  const chapters = modules.map((module) => {
    const moduleOrder = module.order;
    const moduleId = `module-${String(moduleOrder).padStart(2, '0')}`;
    const sections = module.lessons.map((lesson, lessonIndex) => {
      const lessonOrder = lesson.order || lessonIndex + 1;
      const lessonId = `${moduleId}-lesson-${String(lessonOrder).padStart(2, '0')}`;
      return {
        id: lessonId,
        title: normalizeLessonTitle(lesson.title, lessonOrder),
        estimatedMinutes: lesson.estimatedMinutes,
        blocks: lesson.blocks
      };
    });

    return {
      id: moduleId,
      number: moduleOrder,
      title: module.title,
      description: module.description,
      totalMinutes: module.totalMinutes,
      sections
    };
  });

  return {
    topic,
    title,
    description,
    version: `DOCX import ${new Date().toISOString().slice(0, 10)}`,
    chapters
  };
};

const validateNormalizedDoc = (doc) => {
  const errors = [];
  if (!doc || typeof doc !== 'object') {
    return ['Document payload must be an object.'];
  }

  if (!doc.topic || typeof doc.topic !== 'string') {
    errors.push('Missing topic.');
  }
  if (!doc.title || typeof doc.title !== 'string') {
    errors.push('Missing title.');
  }
  if (!doc.description || typeof doc.description !== 'string') {
    errors.push('Missing description.');
  }

  if (!Array.isArray(doc.chapters) || doc.chapters.length === 0) {
    errors.push('Document must contain at least one module.');
    return errors;
  }

  const moduleIds = new Set();
  const moduleTitles = new Set();
  doc.chapters.forEach((chapter, chapterIndex) => {
    const modulePath = `chapters[${chapterIndex}]`;
    if (!chapter.id || typeof chapter.id !== 'string') {
      errors.push(`${modulePath}: missing module id.`);
    } else if (moduleIds.has(chapter.id)) {
      errors.push(`${modulePath}: duplicate module id "${chapter.id}".`);
    } else {
      moduleIds.add(chapter.id);
    }

    if (!chapter.title || typeof chapter.title !== 'string') {
      errors.push(`${modulePath}: missing module title.`);
    } else {
      const normalizedTitle = chapter.title.trim().toLowerCase();
      if (moduleTitles.has(normalizedTitle)) {
        errors.push(`${modulePath}: duplicate module title "${chapter.title}".`);
      }
      moduleTitles.add(normalizedTitle);
    }

    if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
      errors.push(`${modulePath}: module has no lessons.`);
      return;
    }

    const expectedModuleNumber = chapterIndex + 1;
    if (chapter.number !== expectedModuleNumber) {
      errors.push(
        `${modulePath}: module number mismatch, expected ${expectedModuleNumber}, got ${chapter.number}.`
      );
    }

    const lessonIds = new Set();
    let lessonMinutes = 0;
    chapter.sections.forEach((lesson, lessonIndex) => {
      const lessonPath = `${modulePath}.sections[${lessonIndex}]`;
      if (!lesson.id || typeof lesson.id !== 'string') {
        errors.push(`${lessonPath}: missing lesson id.`);
      } else if (lessonIds.has(lesson.id)) {
        errors.push(`${lessonPath}: duplicate lesson id "${lesson.id}".`);
      } else {
        lessonIds.add(lesson.id);
      }

      if (!lesson.title || typeof lesson.title !== 'string') {
        errors.push(`${lessonPath}: missing lesson title.`);
      } else if (DUPLICATE_LESSON_PREFIX_REGEX.test(lesson.title)) {
        errors.push(`${lessonPath}: duplicate lesson prefix in title "${lesson.title}".`);
      }

      if (!Number.isFinite(lesson.estimatedMinutes) || Number(lesson.estimatedMinutes) <= 0) {
        errors.push(`${lessonPath}: invalid estimatedMinutes.`);
      } else {
        lessonMinutes += Number(lesson.estimatedMinutes);
      }

      if (!Array.isArray(lesson.blocks) || lesson.blocks.length === 0) {
        errors.push(`${lessonPath}: lesson has no content blocks.`);
      } else {
        lesson.blocks.forEach((block, blockIndex) => {
          const blockPath = `${lessonPath}.blocks[${blockIndex}]`;
          if (!block || typeof block !== 'object' || !block.type) {
            errors.push(`${blockPath}: invalid block.`);
            return;
          }

          if (block.type === 'code') {
            if (!block.language || typeof block.language !== 'string') {
              errors.push(`${blockPath}: code block missing language.`);
            }
            if (!block.content || typeof block.content !== 'string') {
              errors.push(`${blockPath}: code block missing content.`);
            }
          }
        });
      }
    });

    if (lessonMinutes !== chapter.totalMinutes) {
      errors.push(
        `${modulePath}: totalMinutes mismatch, expected ${lessonMinutes}, got ${chapter.totalMinutes}.`
      );
    }
  });

  return errors;
};

const buildPreviewMarkdown = (doc) => {
  const moduleCount = doc.chapters.length;
  const lessonCount = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.sections.length,
    0
  );
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );

  const lines = [
    `# ${doc.title}`,
    '',
    `- Topic: \`${doc.topic}\``,
    `- Modules: ${moduleCount}`,
    `- Lessons: ${lessonCount}`,
    `- Total minutes: ${totalMinutes}`,
    `- Version: ${doc.version}`,
    '',
    '## Modules'
  ];

  doc.chapters.forEach((chapter) => {
    lines.push(
      `- M${chapter.number} ${chapter.title} (${chapter.totalMinutes} min, ${chapter.sections.length} lessons)`
    );
    chapter.sections.forEach((section) => {
      lines.push(`  - ${section.title} (${section.estimatedMinutes} min)`);
    });
  });

  return lines.join('\n');
};

const writeJson = (filePath, payload) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const runIngest = (options) => {
  const topic = String(options.topic ?? '').trim();
  const title = String(options.title ?? '').trim();
  const description = String(options.description ?? '').trim();
  if (!topic || !title || !description) {
    throw new Error('Ingest requires --topic, --title, and --description.');
  }

  const sourceFiles = listDocxFiles({
    input: options.input,
    inputDir: options['input-dir']
  });
  const outputPath = path.resolve(
    String(
      options.out ??
        path.join('data', 'learn', 'theory', 'drafts', `${slugify(topic)}.normalized.json`)
    )
  );

  const doc = buildNormalizedTheoryDoc({
    topic,
    title,
    description,
    sourceFiles
  });
  const errors = validateNormalizedDoc(doc);
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  writeJson(outputPath, doc);
  process.stdout.write(`Ingested ${sourceFiles.length} DOCX files -> ${outputPath}\n`);
};

const runPreview = (options) => {
  const inputPath = path.resolve(String(options.input ?? ''));
  if (!inputPath) {
    throw new Error('Preview requires --input <normalized-json>.');
  }
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = validateNormalizedDoc(payload);
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  const markdown = buildPreviewMarkdown(payload);
  const previewPath = path.resolve(
    String(
      options.out ??
        path.join('data', 'learn', 'theory', 'previews', `${slugify(payload.topic)}.preview.md`)
    )
  );
  ensureDir(path.dirname(previewPath));
  fs.writeFileSync(previewPath, `${markdown}\n`, 'utf8');
  process.stdout.write(`Preview generated -> ${previewPath}\n`);
};

const runPublish = (options) => {
  const inputPath = path.resolve(String(options.input ?? ''));
  if (!inputPath) {
    throw new Error('Publish requires --input <normalized-json>.');
  }
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const errors = validateNormalizedDoc(payload);
  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  }

  const outputPath = path.resolve(
    String(
      options.out ??
        path.join('data', 'learn', 'theory', 'published', `${slugify(payload.topic)}.json`)
    )
  );
  writeJson(outputPath, payload);
  process.stdout.write(`Published normalized content -> ${outputPath}\n`);
};

const printUsage = () => {
  const usage = `
Theory content pipeline

Commands:
  ingest  --topic <topic> --title <title> --description <description> [--input <file.docx> ... | --input-dir <dir>] [--out <file.json>]
  preview --input <file.json> [--out <file.md>]
  publish --input <file.json> [--out <file.json>]

Examples:
  node tools/theory-content-pipeline.cjs ingest --topic pyspark --title "PySpark Modules" --description "Module curriculum" --input-dir "/Users/.../PySpark"
  node tools/theory-content-pipeline.cjs preview --input data/learn/theory/drafts/pyspark.normalized.json
  node tools/theory-content-pipeline.cjs publish --input data/learn/theory/drafts/pyspark.normalized.json
`;
  process.stdout.write(usage.trimStart());
};

const main = () => {
  const { command, options } = parseArgs(process.argv);

  if (!command || command === 'help' || command === '--help') {
    printUsage();
    return;
  }

  if (command === 'ingest') {
    runIngest(options);
    return;
  }
  if (command === 'preview') {
    runPreview(options);
    return;
  }
  if (command === 'publish') {
    runPublish(options);
    return;
  }

  throw new Error(`Unknown command "${command}". Use "help".`);
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

module.exports = {
  buildNormalizedTheoryDoc,
  buildPreviewMarkdown,
  extractParagraphsFromDocx,
  normalizeLessonTitle,
  parseModuleFromParagraphs,
  splitIntoParagraphs,
  validateNormalizedDoc
};
