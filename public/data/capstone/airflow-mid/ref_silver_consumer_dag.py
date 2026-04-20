# dags/saulegrid_silver_transform.py
# Read-only reference — Silver consumer, Dataset-scheduled.
# Modified during Friday modernization sprint. Do not edit.

from airflow.decorators import dag, task
from airflow.datasets import Dataset
from datetime import datetime
import pendulum


BRONZE_DATASET = Dataset("saulegrid://bronze/meters")
SILVER_DATASET = Dataset("saulegrid://silver/meters")


@dag(
    dag_id="saulegrid_silver_transform",
    description="SaulėGrid Silver transform — cleansed meter readings with joins",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule=[BRONZE_DATASET],
    catchup=False,
    tags=["silver", "meters"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def saulegrid_silver_transform():
    @task(outlets=[SILVER_DATASET])
    def transform_silver() -> int:
        return 1_200_000

    transform_silver()


saulegrid_silver_transform()
