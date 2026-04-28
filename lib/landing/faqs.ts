export interface LandingFaq {
  q: string;
  a: string;
}

export const LANDING_FAQS: readonly LandingFaq[] = [
  {
    q: 'What is stablegrid.io?',
    a: "An ed-tech platform for analysts and data engineers who'd rather understand a query plan than collect another certificate. Deep theory, real projects, no shortcuts.",
  },
  {
    q: 'Who is it for?',
    a: 'Working analysts, junior engineers, and self-taught learners moving toward data engineering or analytics. Three tiers — Junior (foundations), Mid (advanced systems), Senior (platform architecture).',
  },
  {
    q: 'What will I learn?',
    a: 'PySpark, Microsoft Fabric, SQL, data modeling, ETL, performance tuning. Each track is ~42–66 hours of deep theory paired with hands-on practice sets.',
  },
  {
    q: 'What does it cost?',
    a: 'Free during beta. After launch, supporters pay €2.99/month — locked in for life.',
  },
  {
    q: 'How is this different from DataCamp or Coursera?',
    a: "We don't sell certificates. We teach you to read query plans, build pipelines, and understand systems. The output is a portfolio, not a paper credential.",
  },
];
