# dags/saulegrid_bronze_meters.py
# SaulėGrid — Bronze layer meter ingestion
# Modified during Friday modernization sprint (2026-03-27) — PARTIAL
# Author: Rokas (on PTO through 2026-04-06)
#
# Chapter 3 starter — this is the current production file.
# The bug from your Chapter 2 root-cause selection lives here.

from airflow.decorators import dag, task
from airflow.operators.trigger_dagrun import TriggerDagRunOperator
from airflow.utils.trigger_rule import TriggerRule
from airflow.models import Variable
from airflow.providers.sftp.hooks.sftp import SFTPHook
from datetime import datetime
import pendulum


SAULEGRID_REGIONS = [
    "VILNIUS", "KAUNAS", "KLAIPEDA", "SIAULIAI", "PANEVEZYS",
    "ALYTUS", "MARIJAMPOLE", "UTENA", "TELSIAI", "TAURAGE",
]


DOC_MD = """
### SaulėGrid Bronze Meter Ingestion (Mid-Level)

Daily 01:00 Europe/Vilnius pull of 1.2M smart-meter readings from the
SFTP inbox into the Bronze Parquet layer.

**Upstream:** SFTP `sftp_saulegrid_meters` at the path in Variable `meter_sftp_path`.
**Downstream:** Emits Dataset `saulegrid://bronze/meters` to trigger `saulegrid_silver_transform`.
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

    # YOUR SOLUTION BELOW
    # The Friday sprint converted Silver and Gold to Dataset-scheduled DAGs.
    # Silver's schedule is now [Dataset("saulegrid://bronze/meters")].
    # This producer DAG was never updated. Fix that.
    #
    # Required:
    #  - import the Dataset class from the right Airflow module
    #  - declare SILVER_DATASET = Dataset("saulegrid://bronze/meters") at module level
    #  - add outlets=[SILVER_DATASET] to load_bronze
    #  - the TriggerDagRunOperator at the end must be REMOVED
    #    (Dataset emission supersedes manual trigger — keeping both
    #     causes a duplicate Silver run which violates idempotency)

    @task(trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS)
    def load_bronze(region_paths: list) -> int:
        return len(region_paths) * 120_000

    trigger_silver = TriggerDagRunOperator(
        task_id="trigger_silver",
        trigger_dag_id="saulegrid_silver_transform",
    )

    # YOUR SOLUTION ABOVE

    file_path = download_meters()
    region_paths = validate_region.expand(
        region=SAULEGRID_REGIONS,
        file_path=[file_path] * len(SAULEGRID_REGIONS),
    )
    loaded = load_bronze(region_paths)
    loaded >> trigger_silver


saulegrid_bronze_meters()
