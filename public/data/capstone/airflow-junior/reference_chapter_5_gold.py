# dags/gold_aggregate.py
# SaulėGrid — Gold layer regional aggregation
# Chapter 5 reference solution

from airflow.decorators import dag, task
from airflow.sensors.external_task import ExternalTaskSensor
from datetime import datetime
import pendulum


@dag(
    dag_id="saulegrid_gold_aggregate",
    description="SaulėGrid Gold regional aggregation — per-region daily totals",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule="0 4 * * *",
    catchup=False,
    tags=["gold", "aggregate"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def gold_aggregate():
    wait_for_silver = ExternalTaskSensor(
        task_id="wait_for_silver",
        external_dag_id="saulegrid_silver_transform",
        external_task_id=None,
    )

    @task
    def aggregate_regions() -> int:
        return 4

    wait_for_silver >> aggregate_regions()


gold_aggregate()
