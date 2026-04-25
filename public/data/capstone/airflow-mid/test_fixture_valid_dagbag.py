# Test fixture: correctly linked DagBag.
# The assertion harness loads this into a DagBag and passes it to
# the student's find_orphaned_consumers() function.
# Expected return: []

from airflow.decorators import dag, task
from airflow.datasets import Dataset
from datetime import datetime

BRONZE = Dataset("saulegrid://bronze/meters")
SILVER = Dataset("saulegrid://silver/meters")


@dag(dag_id="fixture_bronze", start_date=datetime(2026, 1, 1), schedule="0 1 * * *", catchup=False)
def fixture_bronze():
    @task(outlets=[BRONZE])
    def emit_bronze() -> int:
        return 1

    emit_bronze()


@dag(dag_id="fixture_silver", start_date=datetime(2026, 1, 1), schedule=[BRONZE], catchup=False)
def fixture_silver():
    @task(outlets=[SILVER])
    def emit_silver() -> int:
        return 1

    emit_silver()


@dag(dag_id="fixture_gold", start_date=datetime(2026, 1, 1), schedule=[SILVER], catchup=False)
def fixture_gold():
    @task
    def consume_silver() -> int:
        return 1

    consume_silver()


fixture_bronze()
fixture_silver()
fixture_gold()
