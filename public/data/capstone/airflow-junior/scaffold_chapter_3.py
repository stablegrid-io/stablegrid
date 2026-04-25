# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 3 starter — tasks exist (Chapter 2) but use the verbose
# classic style. Rewrite validation and loading with TaskFlow so
# the data passing is explicit, and fix the schedule to match
# SaulėGrid's operational window.

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator
from datetime import datetime
import pendulum


@dag(
    dag_id="saulegrid_bronze_meters",
    description="SaulėGrid Bronze meter ingestion — daily SFTP pull",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule="@daily",  # YOUR SOLUTION: replace with an exact cron expression
    catchup=False,
    tags=["bronze", "meters"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def bronze_meters():
    download_meters = BashOperator(
        task_id="download_meters",
        bash_command="bash /opt/saulegrid/scripts/sftp_download.sh meters",
    )

    # YOUR SOLUTION BELOW
    # Replace the Chapter 2 PythonOperator tasks with two @task functions:
    #
    # 1. A @task named validate_meters that takes a file_path (str) and
    #    returns the cleaned file path (str).
    #
    # 2. A @task named load_bronze that takes the cleaned path from
    #    validate_meters and returns the number of rows written (int).
    #
    # Also update the DAG schedule above to run once daily at 01:00
    # Europe/Vilnius local time. The current "@daily" preset runs at
    # midnight UTC, which is not what SaulėGrid wants.

    pass

    # YOUR SOLUTION ABOVE


bronze_meters()
