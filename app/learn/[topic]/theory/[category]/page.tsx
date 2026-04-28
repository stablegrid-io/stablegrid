import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { TheoryLayout } from '@/components/learn/theory/TheoryLayout';
import { TheoryTrackPath } from '@/components/learn/theory/TheoryTrackPath';
import { TrackEssentialsInterstitial } from '@/components/learn/theory/TrackEssentialsInterstitial';
import { CapstoneProjectView } from '@/components/learn/theory/CapstoneProjectView';
import { learnTopics, getLearnTopicMeta } from '@/data/learn';
import { theoryDocs } from '@/data/learn/theory';
import { BreadcrumbJsonLd } from '@/lib/seo/jsonLd';
import { getTrackEssentials } from '@/data/learn/trackEssentials';

const TRACK_LEVEL_ACCENT: Record<string, { color: string; rgb: string }> = {
  junior: { color: '#99f7ff', rgb: '153,247,255' },
  mid:    { color: '#ffc965', rgb: '255,201,101' },
  senior: { color: '#ff716c', rgb: '255,113,108' },
};
import { getPracticeSets, getPracticeSet } from '@/data/operations/practice-sets';
import { PracticeSetSession } from '@/app/operations/practice/[topic]/[level]/[modulePrefix]/PracticeSetViewer';
import { ModuleCheckpointSession } from '@/components/learn/theory/ModuleCheckpointSession';
import {
  filterTheoryDocByCategory,
  getChapterCategorySlug,
  getTheoryCategories,
  getTheoryCategoryMeta,
  type TheoryCategorySlug
} from '@/data/learn/theory/categories';
import {
  getTheoryTrackBySlug,
  getTheoryTrackDocBySlug,
  getTheoryTracks
} from '@/data/learn/theory/tracks';
import { loadServerTheoryProgress } from '@/lib/learn/serverTheoryProgress';
import { createClient } from '@/lib/supabase/server';

interface LearnTopicTheoryCategoryPageProps {
  params: {
    topic: string;
    category: string;
  };
  searchParams?: {
    chapter?: string | string[];
    lesson?: string | string[];
    practice?: string | string[];
    capstone?: string | string[];
    essentials?: string | string[];
    checkpoint?: string | string[];
  };
}

const ALL_CATEGORY = 'all';

export default async function LearnTopicTheoryCategoryPage({
  params,
  searchParams
}: LearnTopicTheoryCategoryPageProps) {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    notFound();
  }

  const categoryParam = params.category.toLowerCase();

  // Redirect legacy track slugs to current ones
  const LEGACY_SLUG_MAP: Record<string, string> = {
    'data-engineering-track': 'junior',
    'full-stack': 'junior',
    'beginner': 'junior',
    'beginner-track': 'junior',
    'intermediate': 'mid',
    'intermediate-track': 'mid',
    'advanced': 'senior',
    'advanced-track': 'senior',
  };
  const mappedSlug = LEGACY_SLUG_MAP[categoryParam];
  if (mappedSlug) {
    const sp = searchParams ?? {};
    const searchStr = Object.keys(sp).length > 0
      ? '?' + Object.entries(sp)
          .flatMap(([k, v]) => Array.isArray(v) ? v.map(val => `${k}=${val}`) : v ? [`${k}=${v}`] : [])
          .join('&')
      : '';
    redirect(`/learn/${params.topic}/theory/${mappedSlug}${searchStr}`);
  }

  const track = getTheoryTrackBySlug(doc, categoryParam);
  if (track) {
    const trackDoc = getTheoryTrackDocBySlug(doc, categoryParam) ?? doc;

    // Capstone project view (?capstone=true)
    const requestedCapstone =
      typeof searchParams?.capstone === 'string'
        ? searchParams.capstone
        : Array.isArray(searchParams?.capstone)
          ? searchParams.capstone[0]
          : null;

    if (requestedCapstone) {
      return <CapstoneProjectView topic={params.topic} level={categoryParam} />;
    }

    // Practice session view (?practice=module-XX)
    const requestedPractice =
      typeof searchParams?.practice === 'string'
        ? searchParams.practice
        : Array.isArray(searchParams?.practice)
          ? searchParams.practice[0]
          : null;

    if (requestedPractice) {
      const modulePrefix = requestedPractice.replace(/^module-/, '');
      const practiceSet = getPracticeSet(params.topic, modulePrefix);
      if (!practiceSet) {
        notFound();
      }
      return <PracticeSetSession practiceSet={practiceSet} />;
    }

    // Module checkpoint view (?checkpoint=module-XX)
    const requestedCheckpoint =
      typeof searchParams?.checkpoint === 'string'
        ? searchParams.checkpoint
        : Array.isArray(searchParams?.checkpoint)
          ? searchParams.checkpoint[0]
          : null;

    if (requestedCheckpoint) {
      const chapterIndex = trackDoc.chapters.findIndex((c) => c.id === requestedCheckpoint);
      if (chapterIndex < 0) {
        notFound();
      }
      const chapter = trackDoc.chapters[chapterIndex];
      // Next module within the same track. `chapters` reflects the track's
      // canonical order (filterTheoryDocByCategory preserves it), so a +1 lookup
      // is the same advancement the track map uses for its sequential gating.
      const nextChapter = trackDoc.chapters[chapterIndex + 1];
      const nextModuleHref = nextChapter
        ? `/learn/${params.topic}/theory/${categoryParam}?chapter=${nextChapter.id}`
        : undefined;
      const nextModuleTitle = nextChapter
        ? nextChapter.title.replace(/^module\s*\d+\s*:\s*/i, '').trim() || nextChapter.title
        : undefined;
      return (
        <ModuleCheckpointSession
          topic={params.topic}
          trackSlug={categoryParam}
          chapter={chapter}
          returnHref={`/learn/${params.topic}/theory/${categoryParam}`}
          nextModuleHref={nextModuleHref}
          nextModuleTitle={nextModuleTitle}
        />
      );
    }

    const requestedChapter =
      typeof searchParams?.chapter === 'string'
        ? searchParams.chapter
        : Array.isArray(searchParams?.chapter)
          ? searchParams.chapter[0]
          : null;

    if (requestedChapter) {
      return <TheoryLayout doc={trackDoc} />;
    }

    // ── Track essentials interstitial (first visit only, or forced via ?essentials=1) ──
    // Source-of-truth precedence: profiles.seen_track_essentials (cross-device)
    // > seenTrackEssentials cookie (anon + same-device cache). Either suppresses
    // the interstitial. The cookie is preserved as a fast fallback so a brief
    // DB outage on a returning user doesn't replay the welcome screen.
    const cookieKey = `${params.topic}:${categoryParam}`;
    const seenCookie = cookies().get('seenTrackEssentials')?.value ?? '';
    const seenSlugs = new Set(
      decodeURIComponent(seenCookie).split(',').filter(Boolean)
    );
    try {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('seen_track_essentials')
          .eq('id', user.id)
          .maybeSingle<{ seen_track_essentials: string[] | null }>();
        const persisted = Array.isArray(profile?.seen_track_essentials)
          ? profile!.seen_track_essentials
          : [];
        for (const entry of persisted) {
          if (typeof entry === 'string') seenSlugs.add(entry);
        }
      }
    } catch {
      // Tolerate a missing column on fresh installs that haven't run the
      // 20260427121000_profiles_seen_track_essentials migration. Cookie still
      // suppresses the interstitial.
    }
    const forceEssentials =
      typeof searchParams?.essentials === 'string'
        ? searchParams.essentials === '1'
        : Array.isArray(searchParams?.essentials)
          ? searchParams.essentials.includes('1')
          : false;
    const showInterstitial =
      Boolean(getTrackEssentials(params.topic, categoryParam)) &&
      (forceEssentials || !seenSlugs.has(cookieKey));

    if (showInterstitial) {
      const accent = TRACK_LEVEL_ACCENT[categoryParam] ?? TRACK_LEVEL_ACCENT.junior;
      return (
        <TrackEssentialsInterstitial
          topic={params.topic}
          tier={categoryParam}
          trackSlug={categoryParam}
          trackLabel={track.title ?? track.label}
          accentColor={accent.color}
          accentRgb={accent.rgb}
          backHref={`/learn/${params.topic}/theory`}
          continueHref={`/learn/${params.topic}/theory/${categoryParam}`}
        />
      );
    }

    const {
      completedChapterIds,
      chapterProgressById,
      moduleProgressById,
      checkpointPassedById,
      checkpointResultsById
    } = await loadServerTheoryProgress(trackDoc.topic);

    // Load practice sets matching this topic + level
    const allPracticeSets = getPracticeSets(params.topic);
    const levelAliases: Record<string, string[]> = {
      junior: ['junior'],
      mid: ['mid', 'mid-level'],
      senior: ['senior', 'senior-level'],
    };
    const matchLevels = levelAliases[categoryParam] ?? [categoryParam];
    const levelPracticeSets = allPracticeSets.filter((s) =>
      matchLevels.includes(s.metadata?.trackLevel ?? '')
    );

    const topicMeta = getLearnTopicMeta(params.topic);
    return (
      <>
        <BreadcrumbJsonLd
          items={[
            { name: 'Home', url: '/' },
            { name: 'Topics', url: '/topics' },
            {
              name: topicMeta?.title ?? doc.title,
              url: `/learn/${params.topic}/theory`,
            },
            {
              name: track.title ?? track.label,
              url: `/learn/${params.topic}/theory/${categoryParam}`,
            },
          ]}
        />
        <TheoryTrackPath
          doc={trackDoc}
          track={track}
          completedChapterIds={completedChapterIds}
          chapterProgressById={chapterProgressById}
          moduleProgressById={moduleProgressById}
          initialCheckpointPassedById={checkpointPassedById}
          initialCheckpointResultsById={checkpointResultsById}
          practiceSets={levelPracticeSets}
          practiceBasePath={`/learn/${params.topic}/theory/${categoryParam}`}
        />
      </>
    );
  }

  const categories = getTheoryCategories(doc);
  const validSlugs = categories.map((item) => item.slug);
  const isAllCategory = categoryParam === ALL_CATEGORY;

  if (!isAllCategory && !validSlugs.includes(categoryParam as TheoryCategorySlug)) {
    // Maybe the param is a chapter ID (e.g. /theory/module-09) — redirect to the right category
    const chapterCategory = getChapterCategorySlug(doc, categoryParam);
    if (chapterCategory) {
      redirect(`/learn/${params.topic}/theory/${chapterCategory}?chapter=${categoryParam}`);
    }
    notFound();
  }

  const filteredDoc = filterTheoryDocByCategory(
    doc,
    (isAllCategory ? ALL_CATEGORY : categoryParam) as TheoryCategorySlug | 'all'
  );

  if (filteredDoc.chapters.length === 0) {
    notFound();
  }

  const categoryMeta = getTheoryCategoryMeta(
    (isAllCategory ? ALL_CATEGORY : categoryParam) as TheoryCategorySlug | 'all',
    doc.topic
  );

  return (
    <TheoryLayout
      doc={{
        ...filteredDoc,
        title: `${doc.title} · ${categoryMeta.label}`,
        description: categoryMeta.description
      }}
    />
  );
}

export function generateStaticParams() {
  return learnTopics.flatMap((topic) => {
    const doc = theoryDocs[topic.id];
    if (!doc) return [];

    const tracks = getTheoryTracks(doc).map((track) => ({
      topic: topic.id,
      category: track.slug
    }));
    const slugs = getTheoryCategories(doc).map((category) => category.slug);
    return [{ topic: topic.id, category: ALL_CATEGORY }]
      .concat(tracks)
      .concat(slugs.map((category) => ({ topic: topic.id, category })));
  });
}

export function generateMetadata({
  params,
  searchParams
}: LearnTopicTheoryCategoryPageProps): Metadata {
  const doc = theoryDocs[params.topic];
  if (!doc) {
    return {
      title: 'Topic',
      description: 'Module-based theory documentation.'
    };
  }

  // All /learn/* routes are auth-gated (anonymous users see locked tier cards),
  // so block indexing across the board until a public marketing surface exists.
  const noindex = { index: false, follow: false } as const;

  const topicMeta = getLearnTopicMeta(params.topic);
  const topicTitle = topicMeta?.title ?? doc.title;
  const categoryParam = params.category.toLowerCase();
  const track = getTheoryTrackBySlug(doc, categoryParam);

  if (track) {
    const trackName = track.title ?? track.label;
    const canonical = `/learn/${params.topic}/theory/${categoryParam}`;
    return {
      title: `${topicTitle} — ${trackName}`,
      description: track.description,
      alternates: { canonical },
      robots: noindex,
      openGraph: {
        title: `${topicTitle} — ${trackName}`,
        description: track.description,
        url: `https://stablegrid.io${canonical}`,
      },
    };
  }

  const categoryMeta = getTheoryCategoryMeta(
    (categoryParam === ALL_CATEGORY
      ? ALL_CATEGORY
      : categoryParam) as TheoryCategorySlug | 'all',
    doc.topic
  );

  return {
    title: `${topicTitle} — ${categoryMeta.label}`,
    description: categoryMeta.description,
    alternates: { canonical: `/learn/${params.topic}/theory/${categoryParam}` },
    robots: noindex,
  };
}
