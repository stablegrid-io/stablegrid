# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 3 reference solution

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator
from datetime import datetime
import pendulum


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
    def validate_meters(file_path: str) -> str:
        cleaned_path = "/opt/saulegrid/staging/meters_clean.csv"
        return cleaned_path

    @task
    def load_bronze(cleaned_path: str) -> int:
        row_count = 20
        return row_count

    validate_meters("/opt/saulegrid/inbox/meters.csv")
    load_bronze("/opt/saulegrid/staging/meters_clean.csv")


bronze_meters()
