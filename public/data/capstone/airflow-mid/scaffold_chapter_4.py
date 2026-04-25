# tests/test_dataset_linkage.py
# SaulėGrid — Dataset integrity test
# Chapter 4 starter — a DagBag-level check to prevent recurrence.
#
# The grader calls your find_orphaned_consumers() with two fixture
# DagBags: one correctly linked (expect []), and one with the
# orphaned Silver DAG (expect ["saulegrid_silver_transform"]).
# A third fixture contains a cron-scheduled DAG that must NOT be
# flagged (your function must ignore non-Dataset schedules).

from airflow.datasets import Dataset
from airflow.models.dagbag import DagBag


# YOUR SOLUTION BELOW
# Implement the function below so that:
#
#   1. It iterates every DAG in dag_bag.dags
#   2. For each DAG whose schedule is a LIST (not a cron string or None),
#      it collects the Dataset URIs that the DAG requires
#   3. Across ALL DAGs in the bag, it collects Dataset URIs that appear
#      in any task's outlets
#   4. It returns a sorted list of dag_ids whose required Datasets are
#      not produced by ANY task's outlets anywhere in the bag
#   5. A DAG with a cron schedule (string) or no schedule (None) must
#      not be flagged
#
# Signature is fixed — do not change it.


def find_orphaned_consumers(dag_bag: DagBag) -> list:
    pass


# YOUR SOLUTION ABOVE
