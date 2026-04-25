# tests/test_dataset_linkage.py
# Chapter 4 reference solution.

from airflow.datasets import Dataset
from airflow.models.dagbag import DagBag


def find_orphaned_consumers(dag_bag: DagBag) -> list:
    produced_uris = set()
    for dag in dag_bag.dags.values():
        for task in dag.tasks:
            outlets = getattr(task, "outlets", None) or []
            for outlet in outlets:
                if isinstance(outlet, Dataset):
                    produced_uris.add(outlet.uri)

    orphaned = []
    for dag_id, dag in dag_bag.dags.items():
        schedule = getattr(dag, "schedule", None)
        if not isinstance(schedule, list):
            continue
        required_uris = {d.uri for d in schedule if isinstance(d, Dataset)}
        if required_uris - produced_uris:
            orphaned.append(dag_id)

    return sorted(orphaned)
