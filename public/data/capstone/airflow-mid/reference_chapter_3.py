# dags/saulegrid_bronze_meters.py
# Chapter 3 reference solution — producer DAG wired to the Silver Dataset.

from airflow.decorators import dag, task
from airflow.datasets import Dataset
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable
from airflow.providers.sftp.hooks.sftp import SFTPHook
from datetime import datetime
import pendulum


SAULEGRID_REGIONS = [
    "VILNIUS", "KAUNAS", "KLAIPEDA", "SIAULIAI", "PANEVEZYS",
    "ALYTUS", "MARIJAMPOLE", "UTENA", "TELSIAI", "TAURAGE",
]


SILVER_DATASET = Dataset("saulegrid://bronze/meters")


DOC_MD = """
### SaulėGrid Bronze Meter Ingestion (Mid-Level)

Daily 01:00 Europe/Vilnius pull of 1.2M smart-meter readings. On success
emits Dataset `saulegrid://bronze/meters` which triggers Silver.
"""


def on_failure_alert(context):
    print(f"ALERT: {context['task_instance'].task_id} failed")


@dag(
    dag_id="saulegrid_bronze_meters",
    description="SaulėGrid Bronze meter ingestion — daily SFTP pull",
    start_date=datetime(2026, 1, 1, tzinfo=pendulum.timezone("Europe/Vilnius")),
    schedule="0 1 * * *",
    catchup=False,
    tags=["bronze", "meters"],
    default_args={
        "owner": "saulegrid-data",
        "retries": 1,
        "on_failure_callback": on_failure_alert,
    },
    doc_md=DOC_MD,
)
def saulegrid_bronze_meters():
    @task
    def download_meters() -> str:
        remote_path = Variable.get("meter_sftp_path")
        hook = SFTPHook(ssh_conn_id="sftp_saulegrid_meters")
        return "/opt/saulegrid/inbox/meters.csv"

    @task
    def validate_region(region: str, file_path: str) -> str:
        return f"/opt/saulegrid/staging/meters_clean_{region}.csv"

    @task(
        trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS,
        outlets=[SILVER_DATASET],
    )
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 120_000

    file_path = download_meters()
    region_paths = validate_region.expand(
        region=SAULEGRID_REGIONS,
        file_path=[file_path] * len(SAULEGRID_REGIONS),
    )
    load_bronze(region_paths)


saulegrid_bronze_meters()
