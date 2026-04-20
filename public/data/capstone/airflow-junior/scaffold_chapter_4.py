# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 4 starter — the tasks exist, but they have NO dependencies
# set yet. Nothing knows it has to run in any particular order.
# Fix that, and make the validation fan out per region.

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

    @task
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 5

    # YOUR SOLUTION BELOW
    # 1. Expand validate_region into FOUR parallel tasks — one per
    #    SaulėGrid region (VILNIUS, KAUNAS, KLAIPEDA, SIAULIAI).
    #    All four must run in parallel after download_meters.
    # 2. Wire load_bronze to fan in from all four regional validators.
    # 3. Configure load_bronze so that if one region's validation
    #    fails, it still runs with the surviving regions' outputs.
    #    (Hint: the right trigger_rule lives in TriggerRule.)

    pass

    # YOUR SOLUTION ABOVE


bronze_meters()
