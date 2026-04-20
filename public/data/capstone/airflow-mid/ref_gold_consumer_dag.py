# dags/saulegrid_gold_aggregate.py
# Read-only reference — Gold consumer, Dataset-scheduled.
# Modified during Friday modernization sprint. Do not edit.

from airflow.decorators import dag, task
from airflow.datasets import Dataset
from datetime import datetime
import pendulum


SILVER_DATASET = Dataset("saulegrid://silver/meters")
GOLD_VERT_DATASET = Dataset("saulegrid://gold/vert_extract")


@dag(
    dag_id="saulegrid_gold_aggregate",
    description="SaulėGrid Gold VERT regulatory extract",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule=[SILVER_DATASET],
    catchup=False,
    tags=["gold", "vert"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def saulegrid_gold_aggregate():
    @task(outlets=[GOLD_VERT_DATASET])
    def build_vert_extract() -> str:
        return "/opt/saulegrid/gold/vert_extract_2026-03-30.csv"

    build_vert_extract()


saulegrid_gold_aggregate()
