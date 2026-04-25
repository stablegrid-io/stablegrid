# Test fixture: broken DagBag — Silver's Dataset is never produced.
# The assertion harness loads this and passes it to the student's
# find_orphaned_consumers() function.
# Expected return: ["fixture_silver"]

from airflow.decorators import dag, task
from airflow.datasets import Dataset
from datetime import datetime

BRONZE = Dataset("saulegrid://bronze/meters")
SILVER = Dataset("saulegrid://silver/meters")


@dag(dag_id="fixture_bronze", start_date=datetime(2026, 1, 1), schedule="0 1 * * *", catchup=False)
def fixture_bronze_broken():
    @task
    def emit_nothing() -> int:
        return 1

    emit_nothing()


@dag(dag_id="fixture_silver", start_date=datetime(2026, 1, 1), schedule=[BRONZE], catchup=False)
def fixture_silver_broken():
    @task(outlets=[SILVER])
    def emit_silver() -> int:
        return 1

    emit_silver()


@dag(dag_id="fixture_gold_cron", start_date=datetime(2026, 1, 1), schedule="0 4 * * *", catchup=False)
def fixture_gold_cron():
    @task
    def consume() -> int:
        return 1

    consume()


fixture_bronze_broken()
fixture_silver_broken()
fixture_gold_cron()
