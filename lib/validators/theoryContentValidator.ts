import type { ContentBlock, TheoryChapter, TheoryDoc, TheorySection } from '@/types/theory';

export interface TheoryValidationError {
  code: string;
  path: string;
  message: string;
}

export interface TheoryValidationResult {
  isValid: boolean;
  errors: TheoryValidationError[];
}

const LESSON_PREFIX_REGEX = /^lesson\s*(\d+)\s*:/i;
const DUPLICATE_LESSON_PREFIX_REGEX = /^lesson\s*\d+\s*:\s*lesson\s*\d+\s*:/i;
const MARKDOWN_LINK_REGEX = /\[[^\]]+\]\(([^)]+)\)/g;
const MARKDOWN_CODE_FENCE_REGEX = /```/;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const pushError = (
  errors: TheoryValidationError[],
  path: string,
  code: string,
  message: string
) => {
  errors.push({ path, code, message });
};

const isValidLinkTarget = (target: string) => {
  if (target.startsWith('/') || target.startsWith('#') || target.startsWith('mailto:')) {
    return true;
  }

  if (!/^https?:\/\//i.test(target)) {
    return false;
  }

  try {
    const parsed = new URL(target);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateMarkdownLinks = (
  value: string,
  path: string,
  errors: TheoryValidationError[]
) => {
  for (const match of value.matchAll(MARKDOWN_LINK_REGEX)) {
    const target = (match[1] ?? '').trim();
    if (!isValidLinkTarget(target)) {
      pushError(
        errors,
        path,
        'invalid_link',
        `Invalid markdown link target "${target}".`
      );
    }
  }
};

const validateTextField = (
  value: string | undefined,
  path: string,
  errors: TheoryValidationError[]
) => {
  if (!isNonEmptyString(value)) {
    pushError(errors, path, 'empty_text', 'Text value cannot be empty.');
    return;
  }

  validateMarkdownLinks(value, path, errors);
};

const validateBlock = (
  block: ContentBlock,
  blockPath: string,
  errors: TheoryValidationError[]
) => {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'subheading':
      validateTextField(block.content, `${blockPath}.content`, errors);
      return;

    case 'code':
      if (!isNonEmptyString(block.language)) {
        pushError(errors, `${blockPath}.language`, 'empty_code_language', 'Code block language is required.');
      }
      validateTextField(block.content, `${blockPath}.content`, errors);
      if (typeof block.content === 'string' && MARKDOWN_CODE_FENCE_REGEX.test(block.content)) {
        pushError(
          errors,
          `${blockPath}.content`,
          'code_block_contains_fence',
          'Code block content should not include markdown code fences.'
        );
      }
      return;

    case 'diagram':
      validateTextField(block.content, `${blockPath}.content`, errors);
      if (block.title !== undefined && !isNonEmptyString(block.title)) {
        pushError(errors, `${blockPath}.title`, 'empty_text', 'Diagram title cannot be empty when provided.');
      }
      if (block.caption !== undefined && !isNonEmptyString(block.caption)) {
        pushError(errors, `${blockPath}.caption`, 'empty_text', 'Diagram caption cannot be empty when provided.');
      }
      return;

    case 'callout':
      validateTextField(block.content, `${blockPath}.content`, errors);
      if (block.title !== undefined && !isNonEmptyString(block.title)) {
        pushError(errors, `${blockPath}.title`, 'empty_text', 'Callout title cannot be empty when provided.');
      }
      return;

    case 'bullet-list':
    case 'numbered-list':
      if (block.items.length === 0) {
        pushError(errors, `${blockPath}.items`, 'empty_list', 'List blocks must include at least one item.');
      }
      block.items.forEach((item, index) => {
        validateTextField(item, `${blockPath}.items[${index}]`, errors);
      });
      return;

    case 'table':
      if (block.headers.length === 0) {
        pushError(errors, `${blockPath}.headers`, 'empty_table_headers', 'Table blocks must include headers.');
      }
      block.headers.forEach((header, index) => {
        validateTextField(header, `${blockPath}.headers[${index}]`, errors);
      });
      if (block.rows.length === 0) {
        pushError(errors, `${blockPath}.rows`, 'empty_table_rows', 'Table blocks must include at least one row.');
      }
      block.rows.forEach((row, rowIndex) => {
        if (row.length !== block.headers.length) {
          pushError(
            errors,
            `${blockPath}.rows[${rowIndex}]`,
            'table_row_width_mismatch',
            'Table row width must match the header count.'
          );
        }
        row.forEach((cell, cellIndex) => {
          validateTextField(cell, `${blockPath}.rows[${rowIndex}][${cellIndex}]`, errors);
        });
      });
      return;

    case 'key-concept':
      validateTextField(block.term, `${blockPath}.term`, errors);
      validateTextField(block.definition, `${blockPath}.definition`, errors);
      if (block.analogy !== undefined && !isNonEmptyString(block.analogy)) {
        pushError(errors, `${blockPath}.analogy`, 'empty_text', 'Key concept analogy cannot be empty when provided.');
      }
      return;

    case 'comparison':
      if (block.title !== undefined && !isNonEmptyString(block.title)) {
        pushError(errors, `${blockPath}.title`, 'empty_text', 'Comparison title cannot be empty when provided.');
      }
      validateTextField(block.left.label, `${blockPath}.left.label`, errors);
      validateTextField(block.right.label, `${blockPath}.right.label`, errors);
      if (block.left.points.length === 0) {
        pushError(errors, `${blockPath}.left.points`, 'empty_list', 'Comparison left points cannot be empty.');
      }
      if (block.right.points.length === 0) {
        pushError(errors, `${blockPath}.right.points`, 'empty_list', 'Comparison right points cannot be empty.');
      }
      block.left.points.forEach((point, index) => {
        validateTextField(point, `${blockPath}.left.points[${index}]`, errors);
      });
      block.right.points.forEach((point, index) => {
        validateTextField(point, `${blockPath}.right.points[${index}]`, errors);
      });
      return;
  }
};

const validateSection = (
  section: TheorySection,
  sectionIndex: number,
  sectionPath: string,
  errors: TheoryValidationError[]
) => {
  if (!isNonEmptyString(section.id)) {
    pushError(errors, `${sectionPath}.id`, 'empty_section_id', 'Lesson id is required.');
  }

  validateTextField(section.title, `${sectionPath}.title`, errors);

  if (DUPLICATE_LESSON_PREFIX_REGEX.test(section.title)) {
    pushError(
      errors,
      `${sectionPath}.title`,
      'duplicate_lesson_prefix',
      'Lesson title contains a duplicated "Lesson N:" prefix.'
    );
  }

  const lessonMatch = section.title.match(LESSON_PREFIX_REGEX);
  if (lessonMatch) {
    const lessonNumber = Number(lessonMatch[1]);
    if (lessonNumber !== sectionIndex + 1) {
      pushError(
        errors,
        `${sectionPath}.title`,
        'lesson_prefix_mismatch',
        `Lesson title prefix should be Lesson ${sectionIndex + 1}: for its module order.`
      );
    }
  }

  if (!Number.isFinite(section.estimatedMinutes) || section.estimatedMinutes <= 0) {
    pushError(
      errors,
      `${sectionPath}.estimatedMinutes`,
      'invalid_estimated_minutes',
      'Lesson estimatedMinutes must be greater than 0.'
    );
  }

  if (!Array.isArray(section.blocks) || section.blocks.length === 0) {
    pushError(errors, `${sectionPath}.blocks`, 'empty_lesson_blocks', 'Lesson must include at least one content block.');
    return;
  }

  section.blocks.forEach((block, blockIndex) => {
    validateBlock(block, `${sectionPath}.blocks[${blockIndex}]`, errors);
  });
};

const validateChapter = (
  chapter: TheoryChapter,
  chapterIndex: number,
  chapterPath: string,
  errors: TheoryValidationError[]
) => {
  if (!isNonEmptyString(chapter.id)) {
    pushError(errors, `${chapterPath}.id`, 'empty_module_id', 'Module id is required.');
  }
  validateTextField(chapter.title, `${chapterPath}.title`, errors);
  validateTextField(chapter.description, `${chapterPath}.description`, errors);

  if (!Number.isInteger(chapter.number) || chapter.number <= 0) {
    pushError(errors, `${chapterPath}.number`, 'invalid_module_number', 'Module number must be a positive integer.');
  }
  if (chapter.number !== chapterIndex + 1) {
    pushError(
      errors,
      `${chapterPath}.number`,
      'module_order_mismatch',
      `Module numbers must be contiguous and start at 1. Expected ${chapterIndex + 1}.`
    );
  }

  if (!Number.isFinite(chapter.totalMinutes) || chapter.totalMinutes <= 0) {
    pushError(errors, `${chapterPath}.totalMinutes`, 'invalid_module_minutes', 'Module totalMinutes must be greater than 0.');
  }

  if (!Array.isArray(chapter.sections) || chapter.sections.length === 0) {
    pushError(errors, `${chapterPath}.sections`, 'empty_module_lessons', 'Module must include at least one lesson.');
    return;
  }

  const localSectionIds = new Set<string>();
  const localSectionTitles = new Set<string>();
  chapter.sections.forEach((section, sectionIndex) => {
    const sectionPath = `${chapterPath}.sections[${sectionIndex}]`;
    if (isNonEmptyString(section.id)) {
      if (localSectionIds.has(section.id)) {
        pushError(
          errors,
          `${sectionPath}.id`,
          'duplicate_lesson_id',
          `Duplicate lesson id "${section.id}" in module "${chapter.id}".`
        );
      }
      localSectionIds.add(section.id);
    }
    if (isNonEmptyString(section.title)) {
      const normalizedTitle = section.title
        .replace(LESSON_PREFIX_REGEX, '')
        .trim()
        .toLowerCase();
      if (localSectionTitles.has(normalizedTitle)) {
        pushError(
          errors,
          `${sectionPath}.title`,
          'duplicate_lesson_title',
          `Duplicate lesson title "${section.title}" in module "${chapter.id}".`
        );
      }
      localSectionTitles.add(normalizedTitle);
    }
    validateSection(section, sectionIndex, sectionPath, errors);
  });

  const summedMinutes = chapter.sections.reduce(
    (sum, section) => sum + (Number.isFinite(section.estimatedMinutes) ? section.estimatedMinutes : 0),
    0
  );
  if (Number.isFinite(chapter.totalMinutes) && summedMinutes !== chapter.totalMinutes) {
    pushError(
      errors,
      `${chapterPath}.totalMinutes`,
      'module_minutes_mismatch',
      `Module totalMinutes (${chapter.totalMinutes}) must match summed lesson minutes (${summedMinutes}).`
    );
  }

  if (chapter.checkpointQuiz) {
    const quizPath = `${chapterPath}.checkpointQuiz`;
    validateTextField(chapter.checkpointQuiz.question, `${quizPath}.question`, errors);
    validateTextField(chapter.checkpointQuiz.explanation, `${quizPath}.explanation`, errors);

    if (!Array.isArray(chapter.checkpointQuiz.options) || chapter.checkpointQuiz.options.length < 2) {
      pushError(errors, `${quizPath}.options`, 'invalid_quiz_options', 'Checkpoint quiz must include at least two options.');
    } else {
      chapter.checkpointQuiz.options.forEach((option, optionIndex) => {
        validateTextField(option, `${quizPath}.options[${optionIndex}]`, errors);
      });
    }

    if (!isNonEmptyString(chapter.checkpointQuiz.correctAnswer)) {
      pushError(errors, `${quizPath}.correctAnswer`, 'empty_correct_answer', 'Checkpoint quiz correctAnswer is required.');
    } else if (!chapter.checkpointQuiz.options.includes(chapter.checkpointQuiz.correctAnswer)) {
      pushError(
        errors,
        `${quizPath}.correctAnswer`,
        'correct_answer_not_in_options',
        'Checkpoint quiz correctAnswer must match one of the options.'
      );
    }
  }
};

export const validateTheoryDoc = (doc: TheoryDoc): TheoryValidationResult => {
  const errors: TheoryValidationError[] = [];

  if (!isNonEmptyString(doc.topic)) {
    pushError(errors, 'topic', 'empty_topic', 'Topic is required.');
  }
  validateTextField(doc.title, 'title', errors);
  validateTextField(doc.description, 'description', errors);

  if (!Array.isArray(doc.chapters) || doc.chapters.length === 0) {
    pushError(errors, 'chapters', 'empty_modules', 'Theory doc must include at least one module.');
    return { isValid: false, errors };
  }

  const chapterIds = new Set<string>();
  const chapterTitles = new Set<string>();
  doc.chapters.forEach((chapter, chapterIndex) => {
    const chapterPath = `chapters[${chapterIndex}]`;
    if (isNonEmptyString(chapter.id)) {
      if (chapterIds.has(chapter.id)) {
        pushError(
          errors,
          `${chapterPath}.id`,
          'duplicate_module_id',
          `Duplicate module id "${chapter.id}".`
        );
      }
      chapterIds.add(chapter.id);
    }
    if (isNonEmptyString(chapter.title)) {
      const normalizedTitle = chapter.title.trim().toLowerCase();
      if (chapterTitles.has(normalizedTitle)) {
        pushError(
          errors,
          `${chapterPath}.title`,
          'duplicate_module_title',
          `Duplicate module title "${chapter.title}".`
        );
      }
      chapterTitles.add(normalizedTitle);
    }
    validateChapter(chapter, chapterIndex, chapterPath, errors);
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateTheoryDocs = (
  docs: Record<string, TheoryDoc>
): TheoryValidationResult => {
  const errors = Object.entries(docs).flatMap(([topic, doc]) => {
    const result = validateTheoryDoc(doc);
    return result.errors.map((error) => ({
      ...error,
      path: `${topic}.${error.path}`
    }));
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const formatTheoryValidationErrors = (
  errors: TheoryValidationError[]
) =>
  errors
    .map((error) => `${error.path} [${error.code}] ${error.message}`)
    .join('\n');
