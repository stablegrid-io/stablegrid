# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 2 starter — the DAG now parses (see your Chapter 1 work)
# but the pipeline has no tasks. Add them.

from airflow.decorators import dag
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator
from datetime import datetime


def validate_meters(**context):
    """Validate the downloaded meter file.

    Reads the CSV at /opt/saulegrid/inbox/meters.csv, drops rows where
    meter_id is null, daily_kw is outside the range [-20, 2000], or the
    region is not one of VILNIUS, KAUNAS, KLAIPEDA, SIAULIAI. Writes
    the cleaned CSV to /opt/saulegrid/staging/meters_clean.csv.
    """
    # Implementation already written by Matas — do not modify.
    pass


def load_bronze(**context):
    """Load the validated CSV into the Bronze Parquet layer.

    Reads /opt/saulegrid/staging/meters_clean.csv and writes to
    /opt/saulegrid/bronze/meters/date=YYYY-MM-DD/meters.parquet.
    """
    # Implementation already written by Matas — do not modify.
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
    # YOUR SOLUTION BELOW
    # Add three tasks to this DAG. Do NOT set dependencies yet
    # (dependencies are Chapter 4). Leave the tasks unlinked.
    #
    # Requirements are in the Chapter 2 task specification.

    pass

    # YOUR SOLUTION ABOVE


bronze_meters()
