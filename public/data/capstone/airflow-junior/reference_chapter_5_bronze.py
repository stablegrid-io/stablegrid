# dags/bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Chapter 5 reference solution

from airflow.decorators import dag, task
from airflow.operators.bash import BashOperator
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable
from airflow.providers.sftp.hooks.sftp import SFTPHook
from datetime import datetime
import pendulum


SAULEGRID_REGIONS = ["VILNIUS", "KAUNAS", "KLAIPEDA", "SIAULIAI"]


DOC_MD = """
### SaulėGrid Bronze Meter Ingestion

Daily 01:00 Europe/Vilnius pull of smart-meter readings from the SFTP inbox
into the Bronze Parquet layer.

**Upstream:** SFTP server `sftp_saulegrid_meters` at `/outgoing/meters/`.
**Downstream:** Triggers `saulegrid_silver_transform` on success.

**Contacts:** SaulėGrid data engineering team (Matas, Ieva).
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
def bronze_meters():
    @task
    def download_meters() -> str:
        remote_path = Variable.get("meter_sftp_path")
        hook = SFTPHook(ssh_conn_id="sftp_saulegrid_meters")
        local_path = "/opt/saulegrid/inbox/meters.csv"
        return local_path

    @task
    def validate_region(region: str, file_path: str) -> str:
        return f"/opt/saulegrid/staging/meters_clean_{region}.csv"

    @task(trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 5

    trigger_silver = TriggerDagRunOperator(
        task_id="trigger_silver",
        trigger_dag_id="saulegrid_silver_transform",
    )

    file_path = download_meters()
    region_paths = validate_region.expand(
        region=SAULEGRID_REGIONS,
        file_path=[file_path] * len(SAULEGRID_REGIONS),
    )
    loaded = load_bronze(region_paths)
    loaded >> trigger_silver


bronze_meters()
