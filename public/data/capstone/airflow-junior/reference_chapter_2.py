# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 2 reference solution

from airflow.decorators import dag
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from datetime import datetime


def validate_meters(**context):
    pass


def load_bronze(**context):
    pass


@dag(
    dag_id="saulegrid_bronze_meters",
    description="SaulėGrid Bronze meter ingestion — daily SFTP pull",
    start_date=datetime(2026, 1, 1),
    schedule="@daily",
    catchup=False,
    tags=["bronze", "meters"],
    default_args={"owner": "saulegrid-data", "retries": 1},
)
def bronze_meters():
    download_meters = BashOperator(
        task_id="download_meters",
        bash_command="bash /opt/saulegrid/scripts/sftp_download.sh meters",
    )

    validate = PythonOperator(
        task_id="validate_meters",
        python_callable=validate_meters,
    )

    load = PythonOperator(
        task_id="load_bronze",
        python_callable=load_bronze,
    )


bronze_meters()
