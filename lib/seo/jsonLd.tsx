import type { ReactElement } from 'react';

const SITE_URL = 'https://stablegrid.io';
const ORGANIZATION_NAME = 'StableGrid';

function JsonLd({ data }: { data: unknown }): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd(): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: ORGANIZATION_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/favicon-512-dark.png`,
        description:
          'Ed-tech platform for working data analysts and engineers. Junior to Senior tracks in PySpark, Apache Airflow, Microsoft Fabric, SQL, and Python.',
      }}
    />
  );
}

export interface CourseJsonLdProps {
  name: string;
  description: string;
  url: string;
  totalMinutes?: number;
}

function minutesToISO8601(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `PT${remaining}M`;
  if (remaining === 0) return `PT${hours}H`;
  return `PT${hours}H${remaining}M`;
}

export function CourseJsonLd({
  name,
  description,
  url,
  totalMinutes,
}: CourseJsonLdProps): ReactElement {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: ORGANIZATION_NAME,
      sameAs: SITE_URL,
    },
  };

  if (totalMinutes && totalMinutes > 0) {
    data.hasCourseInstance = {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: minutesToISO8601(totalMinutes),
    };
  }

  return <JsonLd data={data} />;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
        })),
      }}
    />
  );
}

export function WebSiteJsonLd(): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: ORGANIZATION_NAME,
        url: SITE_URL,
        description:
          'Ed-tech platform for working data analysts and engineers. Junior to Senior tracks in PySpark, Apache Airflow, Microsoft Fabric, SQL, and Python.',
        publisher: {
          '@type': 'Organization',
          name: ORGANIZATION_NAME,
          url: SITE_URL,
        },
        inLanguage: 'en-US',
      }}
    />
  );
}

export interface FaqEntry {
  q: string;
  a: string;
}

export function FaqJsonLd({ items }: { items: readonly FaqEntry[] }): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      }}
    />
  );
}

export interface CourseListItem {
  name: string;
  description: string;
  url: string;
}

export function CourseListJsonLd({
  items,
  listName,
  listUrl,
}: {
  items: CourseListItem[];
  listName: string;
  listUrl: string;
}): ReactElement {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: listName,
        url: listUrl.startsWith('http') ? listUrl : `${SITE_URL}${listUrl}`,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Course',
            name: item.name,
            description: item.description,
            url: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`,
            provider: {
              '@type': 'Organization',
              name: ORGANIZATION_NAME,
              sameAs: SITE_URL,
            },
          },
        })),
      }}
    />
  );
}
