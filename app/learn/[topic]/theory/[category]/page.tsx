import { permanentRedirect } from 'next/navigation';

interface LegacyLearnTopicTheoryCategoryPageProps {
  params: { topic: string; category: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function LegacyLearnTopicTheoryCategoryPage({
  params,
  searchParams
}: LegacyLearnTopicTheoryCategoryPageProps) {
  const sp = searchParams ?? {};
  const searchStr =
    Object.keys(sp).length > 0
      ? '?' +
        Object.entries(sp)
          .flatMap(([k, v]) =>
            Array.isArray(v)
              ? v.map((val) => `${k}=${encodeURIComponent(val)}`)
              : v
                ? [`${k}=${encodeURIComponent(v)}`]
                : []
          )
          .join('&')
      : '';
  permanentRedirect(`/theory/${params.category}${searchStr}`);
}
