# PJPySpark Junior Project — Dataset README

All files are hand-authored CSV files. Every row is deliberate.
Do not regenerate these files randomly — the defect counts and positions
are calibrated to produce exact assertion outcomes.

---

## meter_readings_bronze.csv  (25 rows)

Raw meter readings as they arrive from the source system.
Column names match the source system schema (not the Silver schema):
  mtr_id, kwh_reading (string), reading_date (string), rgn_code

### Deliberate defects (8 rows total, 25 − 8 = 17 valid rows after Chapter 2 cleaning)

| Row | mtr_id | Defect type             | Removed by         |
|-----|--------|-------------------------|--------------------|
| 3   | M-018  | null kwh_reading        | isNotNull() filter |
| 5   | M-021  | kwh_reading = -45.0     | range filter (≤ 0) |
| 11  | M-019  | null kwh_reading        | isNotNull() filter |
| 12  | M-023  | kwh_reading = 12500.0   | range filter (≥ 10000) |
| 16  | M-020  | null kwh_reading        | isNotNull() filter |
| 20  | M-001  | duplicate of row 1      | dropDuplicates(['mtr_id','reading_date']) |
| 22  | M-022  | kwh_reading = -120.0    | range filter (≤ 0) |
| 24  | M-024  | rgn_code = 'NRTH'       | region filter (not in NORTH/SOUTH/EAST/WEST) |

Row 25 (M-017) has rgn_code = 'west' (lowercase). After upper(trim()), this
normalises to 'WEST' and is KEPT. It tests that the student applies upper()
in their filter condition rather than filtering on the raw value.

### Valid rows by region (after cleaning)
  NORTH : M-001, M-002, M-003, M-004, M-005  (5 rows)
  SOUTH : M-006, M-007, M-008, M-009          (4 rows)
  EAST  : M-010, M-011, M-012, M-013          (4 rows)
  WEST  : M-014, M-015, M-016, M-017          (4 rows)

---

## substation_ref.csv  (4 rows)

Static reference table. One row per region.
Columns: substation_id, name, region, capacity_mw

  SUB-N → Northern Grid Hub       → NORTH → 450.0 MW
  SUB-S → Southern Power Centre   → SOUTH → 380.0 MW
  SUB-E → Eastern Distribution Node → EAST → 320.0 MW
  SUB-W → Western Relay Station   → WEST  → 290.0 MW

---

## meter_substation_map.csv  (22 rows)

Maps meter_id to substation_id. Not all meters appear here.
Columns: meter_id, substation_id

### Meters WITH a mapping (14 of the 17 valid meters)
  M-001 through M-014 are all mapped to their region's substation.

### Valid meters WITHOUT a mapping (3 of the 17 valid meters)
  M-015, M-016, M-017 are intentionally absent.
  After a left join in Chapter 3, these 3 rows will have null substation_name.
  Assertion A3_4 checks that null_count == 3.

### Defect meters also in this map (8 rows)
  M-018, M-019, M-020, M-021, M-022, M-023, M-024 are mapped here.
  These rows are cleaned out in Chapter 2 before the join, so they never
  produce a match. M-025 is in the map but not in bronze at all — extra rows
  in a reference table are normal and the left join handles them correctly.

---

## silver_reference.csv  (17 rows)

Pre-computed output of a correct Chapter 3 solution. Used as fallback input
for Chapters 4 and 5 when Chapter 3 output is unavailable.

Schema:
  meter_id (string), daily_kw (double), date (date), region (string),
  year (int), month (int), tier (string), substation_name (string, nullable)

Tier thresholds:
  low      : daily_kw < 500
  medium   : 500 ≤ daily_kw < 2000
  high     : 2000 ≤ daily_kw < 4000
  critical : daily_kw ≥ 4000

Null substation_name rows (3): M-015, M-016, M-017

### Expected Gold aggregation from this Silver table

  EAST  : total_kw=4790.0,  avg_kw=1197.5, reading_count=4
  NORTH : total_kw=8521.5,  avg_kw=1704.3, reading_count=5
  SOUTH : total_kw=8890.5,  avg_kw=2222.6, reading_count=4
  WEST  : total_kw=6410.0,  avg_kw=1602.5, reading_count=4

---

## Cross-file consistency

meter_readings_bronze.csv  →  Chapter 2 cleaning  →  17 valid rows
17 valid rows  →  join meter_substation_map + substation_ref  →  silver_reference.csv
silver_reference.csv  →  groupBy(region, month).agg()  →  4 Gold rows

All assertion expected values (row counts, null counts, tier distributions,
Gold aggregation totals) are derived from these files and verified by the
authoring dry-run script.
