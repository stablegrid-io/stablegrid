# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 5 starter — the DAG runs, but nothing downstream knows
# Bronze has finished, credentials are hardcoded in a placeholder,
# and there is no documentation for the on-call engineer. Polish it.

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable
from airflow.providers.sftp.hooks.sftp import SFTPHook
from datetime import datetime
import pendulum


SAULEGRID_REGIONS = ["VILNIUS", "KAUNAS", "KLAIPEDA", "SIAULIAI"]


def on_failure_alert(context):
    """Placeholder failure callback — Matas wired this up."""
    print(f"ALERT: {context['task_instance'].task_id} failed")


@dag(
    dag_id="saulegrid_bronze_meters",
    description="SaulėGrid Bronze meter ingestion — daily SFTP pull",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule="0 1 * * *",
    catchup=False,
    tags=["bronze", "meters"],
    default_args={"owner": "saulegrid-data", "retries": 1},
    # YOUR SOLUTION PART A: add doc_md and on_failure_callback here.
)
def bronze_meters():
    @task
    def download_meters() -> str:
        # YOUR SOLUTION PART B (inside this function):
        # Replace the placeholder block with real integration:
        #   - Look up the SFTP path using Airflow Variable "meter_sftp_path"
        #   - Use SFTPHook with conn_id="sftp_saulegrid_meters"
        # For grading, the variable lookup and the hook instantiation
        # must both appear in this function.

        # --- placeholder block to replace ---
        remote_path = "/placeholder/meters.csv"
        # -------------------------------------

        return remote_path

    @task
    def validate_region(region: str, file_path: str) -> str:
        return f"/opt/saulegrid/staging/meters_clean_{region}.csv"

    @task(trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 5

    # YOUR SOLUTION PART C:
    # After load_bronze completes, kick off the downstream Silver DAG.
    # Add a TriggerDagRunOperator with:
    #   - task_id="trigger_silver"
    #   - trigger_dag_id set to the Silver DAG's id
    #
    # Wire the dependency graph so that:
    #   download_meters -> validate_region (fan-out x4) -> load_bronze -> trigger_silver

    file_path = download_meters()
    region_paths = validate_region.expand(
        region=SAULEGRID_REGIONS,
        file_path=[file_path] * len(SAULEGRID_REGIONS),
    )
    load_bronze(region_paths)

    # YOUR SOLUTION ABOVE


bronze_meters()
