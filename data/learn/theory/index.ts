import type { FrozenTheoryDoc } from '@/types/theory';
import { airflowTheory } from '@/data/learn/theory/airflow';
import { fabricTheory } from '@/data/learn/theory/fabric';
import { pysparkTheory } from '@/data/learn/theory/pyspark';
import { kafkaTheory } from '@/data/learn/theory/kafka';
import { sqlTheory } from '@/data/learn/theory/sql';
import { dockerTheory } from '@/data/learn/theory/docker';
import { dbtTheory } from '@/data/learn/theory/dbt';
import { databricksTheory } from '@/data/learn/theory/databricks';
import { data_modelingTheory } from '@/data/learn/theory/data-modeling';
import { python_deTheory } from '@/data/learn/theory/python-de';
import { cloud_infraTheory } from '@/data/learn/theory/cloud-infra';
import { data_qualityTheory } from '@/data/learn/theory/data-quality';
import { icebergTheory } from '@/data/learn/theory/iceberg';
import { git_cicdTheory } from '@/data/learn/theory/git-cicd';
import { flinkTheory } from '@/data/learn/theory/flink';
import { snowflakeTheory } from '@/data/learn/theory/snowflake';
import { terraformTheory } from '@/data/learn/theory/terraform';
import { spark_streamingTheory } from '@/data/learn/theory/spark-streaming';
import { governanceTheory } from '@/data/learn/theory/governance';
import { freezeTheoryDoc } from '@/lib/learn/freezeTheoryDoc';

const rawTheoryDocs = {
  pyspark: pysparkTheory,
  fabric: fabricTheory,
  airflow: airflowTheory,
  kafka: kafkaTheory,
  sql: sqlTheory,
  docker: dockerTheory,
  dbt: dbtTheory,
  databricks: databricksTheory,
  'data-modeling': data_modelingTheory,
  'python-de': python_deTheory,
  'cloud-infra': cloud_infraTheory,
  'data-quality': data_qualityTheory,
  iceberg: icebergTheory,
  'git-cicd': git_cicdTheory,
  flink: flinkTheory,
  snowflake: snowflakeTheory,
  terraform: terraformTheory,
  'spark-streaming': spark_streamingTheory,
  governance: governanceTheory,
};

export const theoryDocs: Record<string, FrozenTheoryDoc> = Object.entries(
  rawTheoryDocs
).reduce<Record<string, FrozenTheoryDoc>>((accumulator, [key, doc]) => {
  accumulator[key] = freezeTheoryDoc({ ...doc, id: key });
  return accumulator;
}, {});

export const getTheoryMeta = (topic: string) => {
  const doc = theoryDocs[topic];
  if (!doc) return null;
  const chapterCount = doc.chapters.length;
  const totalMinutes = doc.chapters.reduce(
    (sum, chapter) => sum + chapter.totalMinutes,
    0
  );
  return { chapterCount, totalMinutes, version: doc.version };
};
