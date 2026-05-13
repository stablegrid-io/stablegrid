export interface LandingFaq {
  q: string;
  a: string;
}

/**
 * FAQ rendered on the landing page right after the Compare section.
 *
 * Editing rules
 * ─────────────
 * - Don't repeat what other landing sections already say. Topics, tiers,
 *   pricing, and the vs-DataCamp comparison are already covered above —
 *   the FAQ should answer the questions those sections leave open.
 * - Keep pricing in sync with the Pricing section. Today: free during beta,
 *   €14.99 one-time Supporter plan (lifetime access, not subscription).
 * - Avoid hour estimates and exact track counts in the answers; both drift
 *   as the catalogue grows. Prefer "tracks" over "hours".
 */
/**
 * Per-track FAQs emitted as FAQPage JSON-LD on /theory/{junior|mid|senior}
 * (when chapter param is set — i.e. on the lesson-01 previews Googlebot
 * crawls). Copy is keyword-rich on purpose: each track targets a different
 * cluster of PySpark queries.
 */
export const TRACK_FAQS = {
  junior: [
    {
      q: 'What does the Junior PySpark track cover?',
      a: 'Spark fundamentals, SparkSession setup, DataFrame creation, SELECT/WHERE, joins, GROUP BY, I/O for CSV/JSON/Parquet, the built-in functions in pyspark.sql.functions, and a first look at Spark SQL. Ten chapters, one hundred lessons.',
    },
    {
      q: 'Do I need prior PySpark experience to start the Junior track?',
      a: 'No. Junior assumes only basic Python — list comprehensions, functions, importing modules. If you know pandas, the DataFrame mental model transfers almost cleanly. The platform teaches the Spark execution model from first principles.',
    },
    {
      q: 'How long does the Junior PySpark track take?',
      a: 'Roughly thirty to forty hours of reading and practice for a working analyst. The platform tracks per-lesson progress, so you can resume any time and the track-map shows exactly where you stopped.',
    },
    {
      q: 'Does Junior include hands-on PySpark practice?',
      a: 'Yes. Every chapter ships with server-graded practice — you write transforms in a Pyodide-backed editor and the platform checks the actual output, not exact-match strings. Failed attempts deep-link back to the lesson that taught the missing piece.',
    },
  ],
  mid: [
    {
      q: 'What does the Mid PySpark track cover?',
      a: 'Catalyst optimizer internals, partition strategies, broadcast vs shuffle joins, the Delta Lake transaction log, structured streaming, testing PySpark code, deployment patterns, memory tuning, and execution-plan reading. Ten chapters that close the gap between writing PySpark and operating it.',
    },
    {
      q: 'When should I start the Mid track?',
      a: "After the Junior track or equivalent on-the-job PySpark. Mid assumes you've shipped a real pipeline — joined two production tables, hit a skewed key, or watched a job OOM. We don't re-explain DataFrames; we explain why your job is slow.",
    },
    {
      q: 'Does the Mid track cover Spark performance tuning?',
      a: "Yes — partitioning, broadcast thresholds, shuffle spill, adaptive query execution, and how to read the Spark UI to call the bottleneck before the SLA hits. The Catalyst chapter walks you through the optimizer's rule set so you can predict the plan, not just inspect it.",
    },
    {
      q: 'Is Delta Lake covered?',
      a: 'A full chapter — transaction log, time travel, MERGE patterns, schema evolution, and the operational gotchas (VACUUM, OPTIMIZE, Z-ORDER) that separate Delta-in-production from Delta-in-a-notebook.',
    },
  ],
  senior: [
    {
      q: 'What does the Senior PySpark track cover?',
      a: "Platform architecture, Catalyst internals, partition scale, join architecture, schema registries, Spark engine internals (whole-stage codegen, Tungsten, off-heap memory), advanced structured streaming, multi-tenant operations, and governance. Senior is the architectural depth most PySpark courses don't reach.",
    },
    {
      q: "Who is the Senior track for?",
      a: 'Engineers running PySpark in production who need to make architectural calls — when to split a cluster, when to migrate to Photon, how to design a schema registry that survives a team turnover, how to design streaming that won\'t silently drop data on a kafka rebalance. Not a how-to; a why-and-when.',
    },
    {
      q: "Does Senior cover Spark internals?",
      a: 'Yes — whole-stage code generation, Tungsten\'s row layout, off-heap allocation, the shuffle protocol, and how Catalyst rules compose. You leave able to read a stage timeline and reason about what the executors are actually doing.',
    },
    {
      q: 'Is structured streaming covered at depth?',
      a: 'Two chapters — watermarks and late data, stateful operations, checkpointing, recovery semantics, and the rebalance behaviour that quietly breaks pipelines at scale. Plus how to design a streaming job whose failure modes you can actually debug.',
    },
  ],
} satisfies Record<'junior' | 'mid' | 'senior', readonly LandingFaq[]>;

export const LANDING_FAQS: readonly LandingFaq[] = [
  {
    q: 'What is stablegrid.io?',
    a: "An ed-tech platform for working data engineers and analysts who'd rather understand a query plan than collect another certificate. Five tracks — PySpark, Microsoft Fabric, Apache Airflow, SQL, and Python — taught Junior to Senior on one fictional power-grid scenario. Every track pairs deep theory with server-graded practice.",
  },
  {
    q: 'Who is it for, and do I need prior experience?',
    a: "Working analysts, junior engineers, and self-taught learners moving toward data engineering. The Junior tier assumes only basic Python or SQL — we teach the systems part. Mid and Senior assume you've shipped real pipelines and want the architectural depth most courses skip.",
  },
  {
    q: 'How is practice graded?',
    a: 'Server-side. Practice tasks check your code against real assertions, not exact-match strings — you can write the transform any way you like as long as the output matches. When you miss, the platform deep-links you straight back to the lesson that taught the missing piece.',
  },
  {
    q: 'Will I get a certificate?',
    a: "No. The output is fluency you can demonstrate in a query plan or a code review, not a paper credential. If you're learning to pass an exam, this is the wrong platform. If you're learning to ship better data systems, it's built for that.",
  },
  {
    q: 'What does it cost?',
    a: 'Free during beta — every tier, every track, no card needed. If you want to back the build once we launch, the Supporter plan is €14.99 paid once, lifetime access, no subscription, no renewals.',
  },
];
