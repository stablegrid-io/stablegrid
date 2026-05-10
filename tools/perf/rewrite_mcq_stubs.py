#!/usr/bin/env python3
"""One-shot rewrite of placeholder MCQ stubs in PS2-PS10 practice sets.

Replaces the 'Continue / Skip — needs rewrite' single_select with a curated
3-option MCQ that tests the conceptual idea behind the original code task.
Each entry: question label, options (correct first), rationale.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / 'data/operations/practice-sets/pyspark'

# Each entry: id -> dict with 'question', 'correct', 'distractors' (list of 2), 'rationale'
MCQS = {
    'module-PS2-task-05': {
        'question': "Which SparkSession config combination matches the team's brief: descriptive app name, all 8 local cores, 8 shuffle partitions, snappy Parquet?",
        'correct': "appName('NordGrid-TurbineEnrichment-2026-MM-DD'), master('local[*]'), spark.sql.shuffle.partitions=8, spark.sql.parquet.compression.codec='snappy'",
        'distractors': [
            "appName('NordGrid'), master('local[8]'), spark.sql.shuffle.partitions=200, spark.sql.parquet.compression.codec='gzip'",
            "appName('default'), master('yarn'), spark.executor.cores=8, spark.sql.parquet.compression.codec='snappy'",
        ],
        'rationale': "local[*] uses every available core, 8 shuffle partitions matches local development scale, and the snappy codec is the team standard. local[8] hard-codes a count and yarn is for cluster mode.",
    },
    'module-PS3-task-01': {
        'question': "What is the right way to build a 3-row reference DataFrame the team will trust in production?",
        'correct': "spark.createDataFrame(rows, schema=StructType([...])) with every field's nullable=False",
        'distractors': [
            "spark.createDataFrame(rows) and let Spark infer the schema — it's only 3 rows",
            "spark.read.csv(StringIO(...), inferSchema=True) so the engine picks types",
        ],
        'rationale': "Reference data must use an explicit StructType — the team's policy bans inference for trusted tables. Three rows is no exception.",
    },
    'module-PS3-task-02': {
        'question': "Which read pattern matches the team's standard for production CSV ingestion?",
        'correct': "spark.read.schema(StructType([...])).csv(path, header=True) — the schema fixes daily_kw as DoubleType up front",
        'distractors': [
            "spark.read.csv(path, header=True, inferSchema=True) — convenient and fast on production files",
            "spark.read.csv(path).toDF('meter_id','daily_kw','date','region') — typing happens later via .cast()",
        ],
        'rationale': "Explicit StructType is the only option that locks types before the read; inferSchema scans the file twice and may misread numeric columns as strings.",
    },
    'module-PS3-task-04': {
        'question': "Which trio of methods gives the quickest data-quality profile of a fresh Bronze CSV?",
        'correct': "printSchema() for column types, count() for row total, describe('daily_kw') for min/max/mean/stddev/non-null count",
        'distractors': [
            "show(5), collect(), and toPandas() — collect every row to the driver and inspect it",
            "explain(), cache(), and persist() — these reveal the read plan and warm the cache",
        ],
        'rationale': "printSchema/count/describe form the canonical 'first look' triad. collect() pulls everything to the driver and explain() reveals the plan, not the data.",
    },
    'module-PS3-task-06': {
        'question': "Validation pipeline must drop nulls and negatives but KEEP zero readings. Which filter chain is correct?",
        'correct': "df.filter(col('daily_kw').isNotNull()).filter(col('daily_kw') >= 0)",
        'distractors': [
            "df.filter(col('daily_kw') > 0) — single filter, faster, and zero is invalid anyway",
            "df.na.drop().filter(col('daily_kw') != 0) — drop any null row then exclude zeros",
        ],
        'rationale': "`>= 0` keeps zero (a meter that reported but measured nothing) while excluding negatives; `> 0` would silently drop valid zero readings.",
    },
    'module-PS4-task-01': {
        'question': "Bronze has 7 columns; Silver wants only 4 with 2 renamed. Which one-shot select matches the contract?",
        'correct': "df.select(col('meter_id'), col('daily_kw').alias('energy_kw'), col('date').alias('reading_date'), col('region'))",
        'distractors': [
            "df.drop('ingestion_ts','source_file','batch_id').withColumnRenamed('daily_kw','energy_kw').withColumnRenamed('date','reading_date')",
            "df.selectExpr('*').filter('meter_id IS NOT NULL') — selectExpr keeps every column",
        ],
        'rationale': "A single select(...) with alias() yields exactly the 4 named columns in the right order. The drop+rename approach reaches the same shape but uses three passes.",
    },
    'module-PS4-task-02': {
        'question': "Which filter order is safe for: non-null, non-negative, > 1500, region in (NORTH, EAST)?",
        'correct': "df.filter(col('daily_kw').isNotNull()).filter(col('daily_kw') >= 0).filter(col('daily_kw') > 1500).filter(col('region').isin('NORTH','EAST'))",
        'distractors': [
            "df.filter((col('daily_kw') > 1500) & col('region').isin('NORTH','EAST')) — null comparisons short-circuit safely",
            "df.filter('daily_kw > 1500 AND region IN (\"NORTH\",\"EAST\") AND daily_kw IS NOT NULL') — SQL string with the null check last",
        ],
        'rationale': "isNotNull() must come first — `null > 1500` returns null (not false), but the row stays unless explicitly removed. Putting the null check last works in SQL but masks the intent.",
    },
    'module-PS4-task-04': {
        'question': "Two ingestion runs overlapped — same meter_id+date appears twice. Which call is correct?",
        'correct': "df.dropDuplicates(['meter_id','date']) — keeps one arbitrary row per key pair",
        'distractors': [
            "df.distinct() — removes only fully identical rows; metadata differences would let dupes through",
            "df.groupBy('meter_id','date').count() — collapses to a count, losing the daily_kw column",
        ],
        'rationale': "dropDuplicates with a column list de-dupes by business key. distinct() requires every column to match; groupBy().count() loses the value column.",
    },
    'module-PS4-task-06': {
        'question': "What is the safe order for: filter nulls → filter negatives → dedup → select renamed columns?",
        'correct': "Filters first, dedup after, then select — applying filters before dropDuplicates avoids having dedup pick a null/negative row over a valid duplicate",
        'distractors': [
            "Dedup first (smallest dataset), then filters, then select — dedup is the most expensive step so do it on the smallest possible input",
            "Select first to drop unused columns, then dedup, then filters — narrowing the schema makes everything faster",
        ],
        'rationale': "If dedup runs before the null filter, it may keep a null row and drop a valid duplicate. Always cleanse, then dedup. Selecting first would also drop the columns the filters need.",
    },
    'module-PS5-task-01': {
        'question': "Bronze loaded as strings. After `withColumn('daily_kw', col('daily_kw').cast('double'))`, the null count jumps from 4 to 8. Why?",
        'correct': "Cast silently converts unparseable strings ('N/A', 'ERR', '--', 'null') to null in addition to the 4 empty-string rows that were already null",
        'distractors': [
            "Spark fails the cast on bad strings and replaces all 100 rows with null until the bad rows are fixed",
            "withColumn replaces the column entirely so the original null count is reset and we now see all malformed rows",
        ],
        'rationale': "Cast is failure-silent: any string that can't be parsed as the target type becomes null. The 4 unparseable values join the 4 originally-null rows.",
    },
    'module-PS5-task-02': {
        'question': "Source has 'NORTH', 'north', '  NORTH', 'NORTH  ' for the same region. Which transform yields one canonical value?",
        'correct': "df.withColumn('region', upper(trim(col('region')))) — trim whitespace first, then uppercase",
        'distractors': [
            "df.withColumn('region', upper(col('region'))) — uppercase covers casing, downstream joins normalize whitespace anyway",
            "df.withColumn('region', col('region').rlike('^NORTH$')) — a regex match returns the canonical token",
        ],
        'rationale': "Both trim AND upper are needed: ' NORTH' and 'NORTH' differ in whitespace, 'north' and 'NORTH' differ in case. A regex returns boolean, not a value.",
    },
    'module-PS5-task-04': {
        'question': "How do you derive year, month, quarter from a date column AND add daily_mw = daily_kw / 1000 rounded to 3?",
        'correct': "Cast date → DateType, then chain withColumn for year(col), month(col), quarter(col), and round(col('daily_kw')/1000, 3)",
        'distractors': [
            "Cast date → StringType, then use substring(col,1,4) for year and substring(col,6,2) for month — works without DateType",
            "Use selectExpr('YEAR(date), MONTH(date), QUARTER(date)') — selectExpr drops every other column, which is fine because the pipeline only needs the temporal fields",
        ],
        'rationale': "year/month/quarter only work on a DateType column. String slicing is brittle and selectExpr without '*' would lose every other field.",
    },
    'module-PS5-task-06': {
        'question': "consumption_tier = 'low' (<500), 'medium' (<2000), 'high' (<4000), 'critical' otherwise. What does NULL daily_kw resolve to?",
        'correct': "'critical' — null fails every `<` comparison, so it falls through every when() and lands in otherwise()",
        'distractors': [
            "null — when() preserves null inputs and returns null on any branch with a null comparison",
            "'low' — Spark treats null as 0, so it matches the first branch (< 500)",
        ],
        'rationale': "`null < 500` returns null (not true/false); the row never matches a when() and always reaches otherwise(). Spark never coerces null to 0 in numeric comparisons.",
    },
    'module-PS6-task-01': {
        'question': "Which expression is the right groupBy aggregation for total, avg (rounded), and reading count per region?",
        'correct': "df.groupBy('region').agg(sum('daily_kw').alias('total_kw'), round(avg('daily_kw'), 1).alias('avg_kw'), count('meter_id').alias('reading_count'))",
        'distractors': [
            "df.groupBy('region').sum('daily_kw').avg('daily_kw').count() — chained shortcut that returns one column at a time",
            "df.agg(sum('daily_kw'), avg('daily_kw'), count('*')).groupBy('region') — agg before groupBy applies to whole dataset",
        ],
        'rationale': "agg() takes multiple aliased aggregations in one pass. The chained-shortcut form does not exist in PySpark and agg() must follow groupBy.",
    },
    'module-PS6-task-02': {
        'question': "How do you filter regions where the AVERAGE daily_kw exceeds 2400?",
        'correct': "df.filter(is_valid).groupBy('region').agg(round(avg('daily_kw'),1).alias('avg_kw')).filter(col('avg_kw') > 2400)",
        'distractors': [
            "df.filter(is_valid).filter(col('daily_kw') > 2400).groupBy('region').agg(avg('daily_kw').alias('avg_kw')) — pre-filter readings above 2400 then average",
            "df.filter(is_valid).groupBy('region').agg(avg('daily_kw').alias('avg_kw')).where(col('daily_kw') > 2400) — reference the original column in WHERE",
        ],
        'rationale': "Aggregation thresholds (HAVING) run AFTER groupBy. Pre-filtering rows changes which rows enter the average; referencing daily_kw after agg fails because the column is now avg_kw.",
    },
    'module-PS6-task-04': {
        'question': "Why pass an explicit values list to .pivot('region', ['NORTH','SOUTH','EAST','WEST'])?",
        'correct': "It locks column order, eliminates a distinct-values scan, and guarantees all four columns appear even if a region has zero rows in this batch",
        'distractors': [
            "It's required syntax — pivot() throws if the values list is omitted",
            "It speeds up pivoting by parallelizing each value into its own task",
        ],
        'rationale': "Without the list, pivot scans for distinct values (extra job) and column order is undefined. The list also forces missing regions to appear as null columns rather than vanish.",
    },
    'module-PS6-task-06': {
        'question': "Which pair separates 'how many rows reported' vs 'how many distinct meters reported'?",
        'correct': "count('meter_id') counts every non-null reading; countDistinct('meter_id') counts unique meter IDs",
        'distractors': [
            "count('*') and count('meter_id') — both return the number of distinct meters",
            "sum(when(col('meter_id').isNotNull(), 1)) and count('meter_id') — these are equivalent",
        ],
        'rationale': "count(col) skips nulls but counts every row; countDistinct deduplicates. count('*') counts all rows including nulls, not distinct meters.",
    },
    'module-PS7-task-01': {
        'question': "An inner join of 120 readings against 100 meters returns 100 rows. What happened to the other 20?",
        'correct': "Inner join silently drops readings whose meter_id has no match in the reference table — the 20 newly installed meters are excluded",
        'distractors': [
            "Spark caches them in a side table you can recover with df.dropped() — they're temporarily quarantined",
            "Inner join keeps every left-side row; the missing 20 must be a CSV parse failure earlier in the pipeline",
        ],
        'rationale': "Inner join only keeps rows present on BOTH sides — unmatched readings vanish without warning. Spark has no .dropped() method.",
    },
    'module-PS7-task-02': {
        'question': "After df.join(meters, 'meter_id', 'left'), both tables had a 'region' column. What's the safest fix?",
        'correct': "Drop the meters-side region before the join: df.join(meters.drop('region'), 'meter_id', 'left')",
        'distractors': [
            "Use df.join(meters, ['meter_id','region'], 'left') — joining on region too removes the duplicate column",
            "Cast both region columns to the same type — the duplicate disappears once they match",
        ],
        'rationale': "Joining on region would drop readings whose region disagrees with the reference (silent data loss). Casting doesn't deduplicate columns. Drop the duplicate before joining.",
    },
    'module-PS7-task-04': {
        'question': "How do you find meters in the reference table that have NO reading in the readings table?",
        'correct': "meters.join(readings, 'meter_id', 'left_anti') — anti join keeps left rows that have no right match",
        'distractors': [
            "meters.join(readings, 'meter_id', 'left').filter(col('daily_kw').isNull()) — left join + null filter",
            "readings.join(meters, 'meter_id', 'right_anti') — right anti from the readings side",
        ],
        'rationale': "left_anti is the canonical 'in A but not in B' operator and returns only left-side columns. The left+filter approach works but adds reading columns you didn't ask for.",
    },
    'module-PS7-task-06': {
        'question': "Three-table chain: readings → meters → substations, all left joins. What must happen between the two joins?",
        'correct': "After the first join, drop the meters-side region (and any other duplicated key column) BEFORE joining substations, otherwise the second join hits ambiguous columns",
        'distractors': [
            "Cache the intermediate DataFrame so the second join can re-use it without recomputing",
            "Repartition by substation_id so the second join becomes a co-located shuffle",
        ],
        'rationale': "Column ambiguity is a runtime error, not a perf issue. Caching and repartitioning are optional optimizations; resolving the duplicate column is mandatory.",
    },
    'module-PS8-task-01': {
        'question': "Bronze CSV has 3 malformed rows and 'NA' standing in for null. Which read options handle BOTH?",
        'correct': "header=True, nullValue='NA', mode='DROPMALFORMED' — Spark drops the 3 bad rows and treats 'NA' as null at parse time",
        'distractors': [
            "header=True, mode='PERMISSIVE' — keeps the malformed rows with nulls in the bad columns and downstream filters fix them",
            "header=True, mode='FAILFAST' — fails the read so a human can investigate, then we re-run after manual repair",
        ],
        'rationale': "DROPMALFORMED silently discards rows that don't match the schema; PERMISSIVE keeps them as partial nulls; FAILFAST aborts. The brief asks for silent drop, so DROPMALFORMED is correct.",
    },
    'module-PS8-task-03': {
        'question': "Why coalesce(4) before df.write.partitionBy('region').parquet(...)?",
        'correct': "Without coalesce, each task may write a file per region, producing many small files. Coalesce(4) caps tasks at 4 so each region directory ends up with manageable file counts",
        'distractors': [
            "partitionBy requires the input partition count to match the cardinality of the partition column or the write fails",
            "Coalesce sorts the data by region so partitionBy can pick correct directories",
        ],
        'rationale': "Spark writes one file per (input partition × distinct partition value). Capping input partitions limits the small-files explosion. partitionBy doesn't require any specific input layout.",
    },
    'module-PS8-task-05': {
        'question': "JSON has a nested temperature struct. How do you flatten temperature.celsius into a top-level temp_celsius column?",
        'correct': "df.select('station_id', 'date', col('temperature.celsius').alias('temp_celsius'), 'wind_speed_kmh', 'conditions')",
        'distractors': [
            "df.select('*').drop('temperature') — flattens automatically because Spark unwraps top-level structs on select('*')",
            "df.read.json(path, multiLine=True) — multiLine flattens nested fields into the parent row by default",
        ],
        'rationale': "Dot notation inside col() is the canonical way to access nested struct fields. select('*') keeps the struct as-is; multiLine controls record framing, not flattening.",
    },
    'module-PS8-task-06': {
        'question': "Bronze → Silver Parquet → Gold Parquet. Why coalesce(1) before the GOLD write but partitionBy('region') for SILVER?",
        'correct': "Silver is large and queried by region (partition pruning helps); Gold is tiny (4 rows) and read whole, so 1 file is cleaner than 200 empty files",
        'distractors': [
            "partitionBy is forbidden for aggregated tables — Spark only allows partitionBy on raw data",
            "coalesce(1) is required because Parquet can only be written to a single file regardless of dataset size",
        ],
        'rationale': "Layout follows query pattern: prune for selective reads, single-file for whole-table reads. Neither restriction in the distractors is a real Spark rule.",
    },
    'module-PS9-task-01': {
        'question': "Primary feed (scada_kw) and backup (cellular_kw) can both be null. How do you guarantee daily_kw is never null?",
        'correct': "withColumn('daily_kw', coalesce(col('scada_kw'), col('cellular_kw'), lit(0.0))) — coalesce returns the first non-null argument; the literal 0.0 is the final guard",
        'distractors': [
            "withColumn('daily_kw', when(col('scada_kw').isNotNull(), col('scada_kw')).otherwise(col('cellular_kw'))) — falls back to cellular when SCADA missing",
            "na.fill(0.0, ['scada_kw']) then withColumn('daily_kw', col('scada_kw')) — pre-fill nulls and use SCADA directly",
        ],
        'rationale': "coalesce takes any number of arguments and picks the first non-null. The when/otherwise version misses the 'both null' case; the na.fill version ignores cellular_kw entirely.",
    },
    'module-PS9-task-02': {
        'question': "Rank meters within each region by avg daily_kw, descending. Which window definition is right?",
        'correct': "Window.partitionBy('region').orderBy(col('avg_daily_kw').desc()) with row_number() — partition resets the rank per region",
        'distractors': [
            "Window.partitionBy('meter_id').orderBy('avg_daily_kw') with row_number() — partitioning by meter ID gives each meter rank 1",
            "Window.orderBy(col('avg_daily_kw').desc()) — global ordering yields a single 1..20 ranking across all regions",
        ],
        'rationale': "partitionBy defines the rank reset boundary. Partition by region → rank resets each region. Partition by meter_id puts each meter alone in its window (every row is rank 1). No partitionBy → global ranking.",
    },
    'module-PS9-task-03': {
        'question': "lag('daily_kw', 1) over a window partitioned by meter_id, ordered by date. Why is the FIRST row per meter null?",
        'correct': "Lag references the row offset back; the first row in a partition has no predecessor, so the lag value is null and daily_change (today − null) is also null",
        'distractors': [
            "Window functions skip the first row of each partition by design — adjusting the windowSpec to include UNBOUNDED PRECEDING fixes it",
            "lag() requires a default value as a third argument; without it, every row returns null",
        ],
        'rationale': "lag at offset 1 has no value for the partition's first row — that's expected behavior. UNBOUNDED PRECEDING applies to running aggregates, not lag. The third argument (default) is optional.",
    },
    'module-PS9-task-06': {
        'question': "Pipeline must compute daily_kw_billed = ceil(daily_kw) and alert_flag based on daily_kw > 3000. What's the order?",
        'correct': "First add daily_kw via coalesce, then add daily_kw_billed using ceil(col('daily_kw')), then add alert_flag using when(col('daily_kw') > 3000, 'high_alert').otherwise('normal')",
        'distractors': [
            "Order doesn't matter — withColumn calls are independent and Spark reorders them at execution time",
            "Compute alert_flag first based on raw scada_kw, then coalesce — the alert should reflect the original sensor reading, not the fallback",
        ],
        'rationale': "daily_kw_billed and alert_flag both reference daily_kw, so the coalesce step must come first. Alerts are computed on the resolved value (the actual reading used downstream), not the raw sensor.",
    },
    'module-PS10-task-01': {
        'question': "Why does the SQL query call createOrReplaceTempView('readings') before spark.sql('SELECT ... FROM readings')?",
        'correct': "spark.sql() resolves table names against the catalog of registered views; without registration, the readings DataFrame is invisible to SQL",
        'distractors': [
            "Temp views materialize the DataFrame to disk so SQL can query a stable snapshot",
            "Registration is required only for SQL queries that JOIN — single-table queries can reference DataFrames directly",
        ],
        'rationale': "Temp views just expose the DataFrame to the SQL parser; nothing materializes. SQL always needs a name to reference, regardless of join count.",
    },
    'module-PS10-task-02': {
        'question': "Three-table SQL inner join (readings → meters → substations). Why does the result drop to 120 rows from 150?",
        'correct': "Inner join is intersect-only: 5 readings have meter_ids absent from meters and 5 more rows have null daily_kw — both filters strip them out",
        'distractors': [
            "SQL automatically deduplicates the result, removing rows that share the same meter_id+date pair",
            "spark.sql() applies a default LIMIT 120 when no LIMIT clause is provided",
        ],
        'rationale': "Inner joins keep only matched rows on both sides; the WHERE clause removes nulls. SQL never auto-dedups or auto-limits.",
    },
    'module-PS10-task-03': {
        'question': "What advantage does a CTE-based query (`WITH valid_readings AS (...), regional_summary AS (...) SELECT ...`) give over nested subqueries?",
        'correct': "Each CTE is a named, reusable step — analysts read the pipeline top-to-bottom and the regulator can audit each stage by name",
        'distractors': [
            "CTEs are materialized in memory while subqueries are recomputed; CTEs are always faster",
            "CTEs allow recursive joins that subqueries cannot express",
        ],
        'rationale': "Spark inlines non-recursive CTEs (no materialization difference); they're a readability tool. Recursive CTEs exist but aren't relevant here.",
    },
    'module-PS10-task-06': {
        'question': "Capstone hybrid pipeline uses DataFrame API for ETL and SQL for the final aggregation. Why split the pipeline this way?",
        'correct': "DataFrame API is type-safe and easier to test for transforms; SQL is declarative and matches how analysts/regulators read the Gold layer — each stage uses the right tool",
        'distractors': [
            "DataFrame API doesn't support GROUP BY, so SQL is mandatory for any aggregation",
            "SQL queries always run faster than DataFrame transformations because Catalyst optimizes them more aggressively",
        ],
        'rationale': "Both APIs go through the same Catalyst optimizer — performance is equivalent. DataFrame API supports groupBy fully. The split is about readability and audience, not capability.",
    },
}


def main():
    files_changed = 0
    tasks_changed = 0
    missing = []
    for json_path in sorted(ROOT.glob('*_Practice.json')):
        try:
            with json_path.open() as f:
                data = json.load(f)
        except Exception:
            continue
        modified = False
        for task in data.get('tasks', []):
            mcq = MCQS.get(task.get('id'))
            if not mcq:
                continue
            tmpl = task.get('template', {})
            fields = tmpl.get('fields', [])
            if len(fields) != 1:
                continue
            opts = fields[0].get('options', [])
            label_strs = [o if isinstance(o, str) else o.get('label','') for o in opts]
            if label_strs != ['Continue', 'Skip — needs rewrite']:
                continue

            options = [
                {'value': mcq['correct'], 'label': mcq['correct']},
                *[{'value': d, 'label': d} for d in mcq['distractors']],
            ]
            task['template'] = {
                'fields': [{
                    'id': f"{task['id']}-mcq",
                    'type': 'single_select',
                    'label': mcq['question'],
                    'options': [o['label'] for o in options],
                    'correctAnswer': mcq['correct'],
                    'rationale': mcq['rationale'],
                }]
            }
            task['type'] = 'multiple_choice'
            modified = True
            tasks_changed += 1

        if modified:
            with json_path.open('w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write('\n')
            files_changed += 1

    expected_ids = set(MCQS.keys())
    found_ids = set()
    for json_path in ROOT.glob('*_Practice.json'):
        try:
            data = json.load(json_path.open())
        except Exception:
            continue
        for task in data.get('tasks', []):
            if task.get('id') in expected_ids and task.get('type') == 'multiple_choice':
                found_ids.add(task['id'])
    missing = expected_ids - found_ids
    print(f"Files changed: {files_changed}, tasks changed: {tasks_changed}")
    if missing:
        print(f"MISSING (not found in any file): {sorted(missing)}")


if __name__ == '__main__':
    main()
