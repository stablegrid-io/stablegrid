# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 4 reference solution

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator
from airflow.utils.trigger_rule import TriggerRule
from datetime import datetime
import pendulum


SAULEGRID_REGIONS = ["VILNIUS", "KAUNAS", "KLAIPEDA", "SIAULIAI"]


@dag(
    dag_id="saulegrid_bronze_meters",
    description="SaulėGrid Bronze meter ingestion — daily SFTP pull",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule="0 1 * * *",
    catchup=False,
    tags=["bronze", "meters"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def bronze_meters():
    download_meters = BashOperator(
        task_id="download_meters",
        bash_command="bash /opt/saulegrid/scripts/sftp_download.sh meters",
    )

    @task
    def validate_region(region: str, file_path: str) -> str:
        return f"/opt/saulegrid/staging/meters_clean_{region}.csv"

    @task(trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 5

    file_path = "/opt/saulegrid/inbox/meters.csv"

    region_paths = validate_region.expand(
        region=SAULEGRID_REGIONS,
        file_path=[file_path] * len(SAULEGRID_REGIONS),
    )

    download_meters >> region_paths
    load_bronze(region_paths)


bronze_meters()
