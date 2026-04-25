# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 1 reference solution

from airflow.decorators import dag
from datetime import datetime


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
    pass


bronze_meters()
