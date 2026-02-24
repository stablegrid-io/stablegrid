#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DUPLICATE_LESSON_PREFIX_REGEX = /^lesson\s*\d+\s*:\s*lesson\s*\d+\s*:/i;
const LESSON_PREFIX_REGEX = /^lesson\s*(\d+)\s*:\s*/i;
const MODULE_PREFIX_REGEX = /^module\s*(\d+)\s*:\s*/i;
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

const extractParagraphsFromDocx = (docxPath) => {
  let xml = '';
  try {
    xml = execFileSync('unzip', ['-p', docxPath, 'word/document.xml'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to extract "${docxPath}". Ensure "unzip" is installed and the file is valid DOCX.\n${message}`
    );
  }

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
      return line.replace(/\s+/g, ' ').trim();
    })
    .filter((line) => line.length > 0);
};

const parseModuleOrder = (lines, filePath, fallbackOrder) => {
  const fromLine = lines
    .map((line) => line.match(/^module\s*(\d+)\s*:/i))
    .find((match) => Boolean(match));
  if (fromLine) return Number(fromLine[1]);

  const fromFile = path.basename(filePath).match(/module[\s_-]*(\d+)/i);
  if (fromFile) return Number(fromFile[1]);

  return fallbackOrder;
};

const stripPrefix = (title, regex) => title.replace(regex, '').trim();

const normalizeLessonTitle = (rawTitle, order) => {
  const withoutPrefix = stripPrefix(rawTitle, LESSON_PREFIX_REGEX) || rawTitle.trim();
  return `Lesson ${order}: ${withoutPrefix}`;
};

const parseMinutesFromLine = (line) => {
  const match = line.match(/(\d+)\s*min\b/i);
  if (!match) return null;
  const minutes = Number(match[1]);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
};

const parseLessonsFromLines = (moduleLines) => {
  const lessons = [];
  let currentLesson = null;

  moduleLines.forEach((line) => {
    const lessonHeader = line.match(/^lesson\s*(\d+)\s*:\s*(.+)$/i);
    if (lessonHeader) {
      if (currentLesson) {
        lessons.push(currentLesson);
      }
      const order = Number(lessonHeader[1]);
      const title = lessonHeader[2].trim();
      currentLesson = {
        order,
        title,
        minutes: parseMinutesFromLine(line),
        bodyLines: []
      };
      return;
    }

    if (!currentLesson) {
      return;
    }
    currentLesson.bodyLines.push(line);
    if (currentLesson.minutes === null) {
      const inferred = parseMinutesFromLine(line);
      if (inferred) {
        currentLesson.minutes = inferred;
      }
    }
  });

  if (currentLesson) {
    lessons.push(currentLesson);
  }

  return lessons;
};

const parseModuleFromParagraphs = ({ lines, filePath, fallbackOrder }) => {
  const moduleOrder = parseModuleOrder(lines, filePath, fallbackOrder);
  const moduleLineIndex = lines.findIndex((line) => MODULE_PREFIX_REGEX.test(line));
  const moduleTitleLine = moduleLineIndex >= 0 ? lines[moduleLineIndex] : '';
  const fallbackTitle = `Module ${moduleOrder}: Imported Module ${moduleOrder}`;
  const moduleTitle = moduleTitleLine || fallbackTitle;
  const moduleTitleWithoutPrefix = stripPrefix(moduleTitle, MODULE_PREFIX_REGEX);

  const linesAfterTitle = moduleLineIndex >= 0 ? lines.slice(moduleLineIndex + 1) : [...lines];
  const lessons = parseLessonsFromLines(linesAfterTitle);

  let normalizedLessons = lessons;
  if (normalizedLessons.length === 0) {
    const fallbackBody = linesAfterTitle.filter((line) => !MODULE_PREFIX_REGEX.test(line));
    normalizedLessons = [
      {
        order: 1,
        title: `Imported Lesson`,
        minutes: null,
        bodyLines: fallbackBody
      }
    ];
  }

  const sortedLessons = [...normalizedLessons].sort((left, right) => left.order - right.order);
  const lessonObjects = sortedLessons.map((lesson, lessonIndex) => {
    const order = Number.isFinite(lesson.order) ? lesson.order : lessonIndex + 1;
    const title = normalizeLessonTitle(lesson.title, order);
    const contentLines = lesson.bodyLines.filter((line) => line.length > 0);
    const paragraphContent =
      contentLines.length > 0
        ? contentLines.join('\n')
        : `${title} content imported from ${path.basename(filePath)}.`;
    const estimatedMinutes =
      lesson.minutes && lesson.minutes > 0 ? lesson.minutes : DEFAULT_LESSON_MINUTES;

    return {
      order,
      title,
      estimatedMinutes,
      blocks: [
        {
          type: 'paragraph',
          content: paragraphContent
        }
      ]
    };
  });

  const moduleDescriptionLines = linesAfterTitle
    .slice(0, Math.max(0, linesAfterTitle.findIndex((line) => /^lesson\s*\d+\s*:/i.test(line))))
    .filter((line) => line.length > 0);
  const moduleDescription =
    moduleDescriptionLines.join(' ').trim() ||
    `${moduleTitleWithoutPrefix} imported from DOCX source.`;

  const totalMinutes = lessonObjects.reduce(
    (sum, lesson) => sum + (Number(lesson.estimatedMinutes) || 0),
    0
  );

  return {
    order: moduleOrder,
    title: `Module ${moduleOrder}: ${moduleTitleWithoutPrefix}`,
    description: moduleDescription,
    lessons: lessonObjects,
    totalMinutes
  };
};

const buildNormalizedTheoryDoc = ({
  topic,
  title,
  description,
  sourceFiles
}) => {
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

      if (
        !Number.isFinite(lesson.estimatedMinutes) ||
        Number(lesson.estimatedMinutes) <= 0
      ) {
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
  validateNormalizedDoc
};
