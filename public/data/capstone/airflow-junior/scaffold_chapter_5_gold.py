# dags/gold_aggregate.py
# SaulėGrid — Gold layer regional aggregation
# Chapter 5 starter — Gold is currently scheduled independently
# and sometimes runs before Silver finishes, producing empty Gold
# outputs. Add a sensor so Gold waits for Silver to complete.

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
    # YOUR SOLUTION BELOW
    # Add an ExternalTaskSensor as the FIRST task in this DAG. It must:
    #   - task_id="wait_for_silver"
    #   - external_dag_id point at the Silver DAG: "saulegrid_silver_transform"
    #   - external_task_id=None (wait for the whole DAG run, not one task)
    #
    # Then wire it upstream of the existing aggregate_regions task.

    pass

    # YOUR SOLUTION ABOVE

    @task
    def aggregate_regions() -> int:
        return 4

    aggregate_regions()


gold_aggregate()
