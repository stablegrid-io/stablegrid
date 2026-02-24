# Theory Content Pipeline

This pipeline standardizes theory ingestion:

1. DOCX -> normalized JSON
2. Normalized JSON -> preview markdown
3. Validated JSON -> published artifact

## CLI

Use:

```bash
node tools/theory-content-pipeline.cjs <command> [options]
```

Commands:

- `ingest`
- `preview`
- `publish`

## Ingest

Create normalized JSON from DOCX modules:

```bash
node tools/theory-content-pipeline.cjs ingest \
  --topic pyspark \
  --title "PySpark Modules" \
  --description "Module-based theory curriculum" \
  --input-dir "/Users/nedasvaitkus/Desktop/StableGrid material/PySpark" \
  --out data/learn/theory/drafts/pyspark.normalized.json
```

You can also pass multiple files:

```bash
node tools/theory-content-pipeline.cjs ingest \
  --topic pyspark \
  --title "PySpark Modules" \
  --description "Module-based theory curriculum" \
  --input "/path/PySpark_Module_1.docx" \
  --input "/path/PySpark_Module_2.docx"
```

## Preview

Validate + generate a preview markdown summary:

```bash
node tools/theory-content-pipeline.cjs preview \
  --input data/learn/theory/drafts/pyspark.normalized.json \
  --out data/learn/theory/previews/pyspark.preview.md
```

## Publish

Validate + write publish artifact:

```bash
node tools/theory-content-pipeline.cjs publish \
  --input data/learn/theory/drafts/pyspark.normalized.json \
  --out data/learn/theory/published/pyspark.json
```

## Validation checks

The pipeline blocks publish when it detects:

- missing module/lesson titles or ids
- empty modules or lessons
- duplicate module/lesson ids
- duplicate `Lesson N: Lesson N:` title prefixes
- module `totalMinutes` mismatch vs lesson sums
