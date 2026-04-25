# nordgrid_transforms.py
# Shared transformation functions for the NordGrid Silver notebook.
# Imported by nb_transform_meters and by the test notebook nb_run_tests.
#
# Review history:
#   PR #823 (2026-02-10) — initial extraction of filter/standardise/dedupe functions.
#   PR #832 (2026-03-04) — added daily_kw upper bound (10000).
#   PR #847 (2026-04-17) — added tariff_code NOT NULL filter. <── CURRENT HEAD
#
# Deployment: every PR merged to main is picked up on the next pipeline run
# via the workspace's Git integration. No separate release step.

from pyspark.sql import DataFrame
from pyspark.sql.functions import col, upper, trim, coalesce, lit, year, month, current_date


def apply_quality_filters(df: DataFrame) -> DataFrame:
    """Drop rows that violate NordGrid's Bronze-to-Silver quality rules.

    Rules, in order:
      1. meter_id must not be null.
      2. date must not be null and must not be in the future.
      3. daily_kw must be strictly between 0 and 10000.
      4. tariff_code must not be null.   # added in PR #847
    """
    return (
        df
        .filter(col("meter_id").isNotNull())
        .filter(col("date").isNotNull())
        .filter(col("date") <= current_date())
        .filter(col("daily_kw") > 0)
        .filter(col("daily_kw") < 10000)
        .filter(col("tariff_code").isNotNull())       # <── PR #847
    )


def standardize_strings(df: DataFrame) -> DataFrame:
    """Uppercase+trim the region code and fill known string defaults."""
    return (
        df
        .withColumn("region", upper(trim(col("region"))))
        .withColumn("region", coalesce(col("region"), lit("UNKNOWN")))
    )


def add_date_parts(df: DataFrame) -> DataFrame:
    """Add year and month integer columns derived from date."""
    return (
        df
        .withColumn("year",  year(col("date")))
        .withColumn("month", month(col("date")))
    )


def deduplicate_readings(df: DataFrame) -> DataFrame:
    """Deduplicate on the business key (meter_id, date)."""
    return df.dropDuplicates(["meter_id", "date"])


# ---------------------------------------------------------------------------
# Notebook driver — called once per ForEach region iteration.
# Reads Bronze for the given region+date, applies the pipeline, writes Silver.
# ---------------------------------------------------------------------------
def transform_region(spark, region: str, processing_date: str) -> DataFrame:
    df_raw = (
        spark.read
             .format("delta")
             .load("abfss://bronze/.../meter_readings")
             .filter(col("region") == region)
             .filter(col("date") == processing_date)
    )
    return (
        df_raw
          .transform(apply_quality_filters)
          .transform(standardize_strings)
          .transform(add_date_parts)
          .transform(deduplicate_readings)
    )
