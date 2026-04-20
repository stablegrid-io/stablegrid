# PJAirflow Junior-Level Project — Dataset README

All files are hand-authored. Every design decision is deliberate — the data
has been shaped so the assertion suites can meaningfully grade student work.

---

## meter_readings_sample.csv (25 rows)

The file the BashOperator "downloads" from SFTP and the validation task
consumes. Contains intentional defects to exercise the validation logic:

- 20 valid rows — 5 per region (VILNIUS, KAUNAS, KLAIPEDA, SIAULIAI)
- 1 negative daily_kw non-prosumer row (M-VIL-00004) — should be dropped
- 1 null daily_kw row (M-VIL-00005) — should be dropped
- 1 null meter_id row — should be dropped
- 1 out-of-range daily_kw row (99999.9 — M-KAU-00105) — should be dropped
- 1 unknown_region row (M-XXX-99999) — should be dropped

Columns: meter_id, daily_kw, date, region, customer_type, generation_kw

Valid region codes: VILNIUS, KAUNAS, KLAIPEDA, SIAULIAI
Valid daily_kw range: -20 to 2000

After validation: 20 rows remain (see expected_bronze_output.csv).

---

## substation_ref.csv (4 rows)

One row per SaulėGrid region. Used in Silver-layer joins at full pipeline
scale. Included here so region validation logic can cross-check.

  SUB-VIL → Vilnius Central Substation, VILNIUS, 120.0 MW
  SUB-KAU → Kaunas Industrial Hub, KAUNAS, 95.0 MW
  SUB-KLA → Klaipeda Coastal Node, KLAIPEDA, 74.0 MW
  SUB-SIA → Siauliai Regional Station, SIAULIAI, 58.0 MW

Columns: substation_id, name, region, capacity_mw

---

## weather_forecast_sample.csv (8 rows)

Mock response body that the HttpHook pattern would retrieve from the
weather forecast API. Two stations per SaulėGrid region. Used as a
reference payload — the Chapter 5 scaffold demonstrates the shape the
HttpHook result takes.

Columns: station_id, region, temp_c, irradiance_wm2, cloud_cover_pct,
         forecast_ts (ISO-8601 with Europe/Vilnius offset)

---

## vert_tariffs.csv (6 rows)

VERT (Lithuanian energy regulator) feed-in tariff rates by customer type
and effective date. Two effective dates × three customer types.

Columns: effective_date, customer_type, feed_in_tariff_eur,
         net_metering_balance_cap

---

## expected_bronze_output.csv (20 rows)

The correct Bronze output after validation. Used by assertion suites and
as the reference fallback for Chapter 3+ if the student's earlier work
did not produce a usable output.

Schema matches meter_readings_sample.csv minus the 5 invalid rows.

---

## Chapter Scaffolds and References

Starter scaffolds and reference completions for each chapter live alongside
the CSV files so the grader can load them programmatically:

  scaffold_chapter_1.py          — broken @dag() that won't parse
  scaffold_chapter_2.py          — DAG parses, no tasks yet
  scaffold_chapter_3.py          — PythonOperators + @daily preset
  scaffold_chapter_4.py          — tasks without dependencies
  scaffold_chapter_5_bronze.py   — placeholder credentials, no downstream
  scaffold_chapter_5_gold.py     — Gold DAG without sensor

  reference_chapter_1.py         — Ch1 correct answer (Ch2 fallback)
  reference_chapter_2.py         — Ch2 correct answer (Ch3 fallback)
  reference_chapter_3.py         — Ch3 correct answer (Ch4 fallback)
  reference_chapter_4.py         — Ch4 correct answer (Ch5 fallback)
  reference_chapter_5_bronze.py  — Ch5 bronze correct answer
  reference_chapter_5_gold.py    — Ch5 gold correct answer

---

## Scenario Continuity

All data follows the EEDA Data Standard as used in the Airflow Junior-Level
theory track. Column names (meter_id, daily_kw, date, region, customer_type,
generation_kw), region codes (VILNIUS, KAUNAS, KLAIPEDA, SIAULIAI), and
medallion layer names (Bronze, Silver, Gold) are identical to the course
materials and to companion tracks using the same scenario.
