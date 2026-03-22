import type { CheatSheet } from '@/types/learn';
import { airflowData } from '@/data/learn/airflow';
import { fabricData } from '@/data/learn/fabric';
import { pysparkData } from '@/data/learn/pyspark';
import { kafkaData } from '@/data/learn/kafka';
import { sqlData } from '@/data/learn/sql';
import { dockerData } from '@/data/learn/docker';
import { dbtData } from '@/data/learn/dbt';
import { databricksData } from '@/data/learn/databricks';
import { data_modelingData } from '@/data/learn/data-modeling';
import { python_deData } from '@/data/learn/python-de';
import { cloud_infraData } from '@/data/learn/cloud-infra';
import { data_qualityData } from '@/data/learn/data-quality';
import { icebergData } from '@/data/learn/iceberg';
import { git_cicdData } from '@/data/learn/git-cicd';
import { flinkData } from '@/data/learn/flink';
import { snowflakeData } from '@/data/learn/snowflake';
import { terraformData } from '@/data/learn/terraform';
import { spark_streamingData } from '@/data/learn/spark-streaming';
import { governanceData } from '@/data/learn/governance';
import { getTheoryMeta } from '@/data/learn/theory';

export const cheatSheets: Record<string, CheatSheet> = {
  pyspark: pysparkData,
  fabric: fabricData,
  airflow: airflowData,
  kafka: kafkaData,
  sql: sqlData,
  docker: dockerData,
  dbt: dbtData,
  databricks: databricksData,
  'data-modeling': data_modelingData,
  'python-de': python_deData,
  'cloud-infra': cloud_infraData,
  'data-quality': data_qualityData,
  iceberg: icebergData,
  'git-cicd': git_cicdData,
  flink: flinkData,
  snowflake: snowflakeData,
  terraform: terraformData,
  'spark-streaming': spark_streamingData,
  governance: governanceData,
};

export const learnTopics = Object.values(cheatSheets).map((sheet) => {
  const theory = getTheoryMeta(sheet.topic);
  return {
    id: sheet.topic,
    title: sheet.title.replace(' Reference', ''),
    description: sheet.description,
    functionCount: sheet.functions.length,
    chapterCount: theory?.chapterCount ?? 0
  };
});

export const getLearnTopicMeta = (topic: string) => {
  const sheet = cheatSheets[topic];
  if (!sheet) {
    return null;
  }

  const theory = getTheoryMeta(topic);
  return {
    topic,
    title: sheet.title.replace(' Reference', ''),
    description: sheet.description,
    version: theory?.version ?? sheet.version,
    functionCount: sheet.functions.length,
    chapterCount: theory?.chapterCount ?? 0,
    chapterMinutes: theory?.totalMinutes ?? 0
  };
};
