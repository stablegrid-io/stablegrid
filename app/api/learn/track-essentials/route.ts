import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { theoryDocs } from '@/data/learn/theory';
import { getTheoryTracks } from '@/data/learn/theory/tracks';
import { createClient } from '@/lib/supabase/server';
import type { Topic } from '@/types/progress';

const TOPIC_SET = new Set<Topic>(['pyspark', 'fabric', 'airflow', 'sql', 'python-de']);
const isTopic = (value: string): value is Topic => TOPIC_SET.has(value as Topic);

const isValidTrackSlug = (topic: Topic, slug: string): boolean => {
  const doc = theoryDocs[topic];
  if (!doc) return false;
  return getTheoryTracks(doc).some((track) => track.slug === slug);
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let topic: Topic;
  let trackSlug: string;
  try {
    const payload = await parseJsonObject(request);
    const rawTopic = typeof payload.topic === 'string' ? payload.topic : null;
    if (!rawTopic || !isTopic(rawTopic)) {
      throw new ApiRouteError('Invalid topic.', 400);
    }
    const rawSlug = typeof payload.trackSlug === 'string' ? payload.trackSlug.trim().toLowerCase() : '';
    if (!rawSlug || !isValidTrackSlug(rawTopic, rawSlug)) {
      throw new ApiRouteError('Invalid track slug.', 400);
    }
    topic = rawTopic;
    trackSlug = rawSlug;
  } catch (error) {
    return toApiErrorResponse(error, 'Invalid track-essentials payload.');
  }

  try {
    const clientIp = getClientIp(request);
    await Promise.all([
      enforceRateLimit({
        scope: 'track_essentials_user',
        key: user.id,
        limit: 60,
        windowSeconds: 5 * 60
      }),
      enforceRateLimit({
        scope: 'track_essentials_ip',
        key: clientIp,
        limit: 120,
        windowSeconds: 5 * 60
      })
    ]);

    const entry = `${topic}:${trackSlug}`;

    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('seen_track_essentials')
      .eq('id', user.id)
      .maybeSingle<{ seen_track_essentials: string[] | null }>();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const current = Array.isArray(existing?.seen_track_essentials)
      ? existing!.seen_track_essentials
      : [];
    if (current.includes(entry)) {
      return NextResponse.json({ ok: true, seen: current });
    }

    const next = [...current, entry];
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ seen_track_essentials: next })
      .eq('id', user.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({ ok: true, seen: next });
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to record track-essentials acknowledgement.');
  }
}
