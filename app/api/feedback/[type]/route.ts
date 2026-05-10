import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import {
  enforceRateLimit,
  getClientIp,
  readIdempotencyKey,
  runIdempotentJsonRequest,
} from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';

/**
 * Writer endpoint for completion-feedback ratings — module / track /
 * practice-set. Three tables, one route. Each POST upserts the user's
 * rating (unique on user_id + topic + module/track key), so a re-rate
 * overwrites the previous value rather than failing.
 *
 * The components call this from `handleSelect` / `handleSubmit` after
 * persisting to sessionStorage; failure here is non-blocking — the
 * sessionStorage entry still suppresses re-prompts on the same device.
 */

type FeedbackType = 'module' | 'track' | 'practice-set';

const FEEDBACK_TYPES: FeedbackType[] = ['module', 'track', 'practice-set'];

const isFeedbackType = (value: string): value is FeedbackType =>
  FEEDBACK_TYPES.includes(value as FeedbackType);

const isInt1to5 = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 1 &&
  value <= 5;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isNonNegativeInt = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

export async function POST(
  request: Request,
  { params }: { params: { type: string } },
) {
  try {
    const type = params.type;
    if (!isFeedbackType(type)) {
      throw new ApiRouteError(`Unknown feedback type: ${type}`, 400);
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new ApiRouteError('Authentication required.', 401);
    }

    // Conservative rate limit: a single user submitting more than 30
    // feedback rows in a minute is almost certainly a script.
    await enforceRateLimit({
      scope: `feedback_${type.replace('-', '_')}`,
      key: `${user.id}:${getClientIp(request)}`,
      limit: 30,
      windowSeconds: 60,
    });

    const body = await parseJsonObject(request);
    const idempotencyKey = readIdempotencyKey(request);

    return await runIdempotentJsonRequest({
      execute: async () => {
        if (type === 'module') {
          if (!isNonEmptyString(body.topic))
            throw new ApiRouteError('topic required', 400);
          if (!isNonEmptyString(body.moduleId))
            throw new ApiRouteError('moduleId required', 400);
          if (!isNonEmptyString(body.moduleTitle))
            throw new ApiRouteError('moduleTitle required', 400);
          if (!isNonNegativeInt(body.moduleNumber))
            throw new ApiRouteError(
              'moduleNumber must be a non-negative integer',
              400,
            );
          if (!isInt1to5(body.value))
            throw new ApiRouteError('value must be an integer 1-5', 400);

          const { error } = await supabase
            .from('module_feedback')
            .upsert(
              {
                user_id: user.id,
                topic: body.topic,
                module_id: body.moduleId,
                module_title: body.moduleTitle,
                module_number: body.moduleNumber,
                value: body.value,
              },
              { onConflict: 'user_id,topic,module_id' },
            );
          if (error) throw new ApiRouteError(error.message, 500);
          return { body: { data: { ok: true } }, status: 200 };
        }

        if (type === 'track') {
          if (!isNonEmptyString(body.topic))
            throw new ApiRouteError('topic required', 400);
          if (!isNonEmptyString(body.trackSlug))
            throw new ApiRouteError('trackSlug required', 400);
          const trackSlug = body.trackSlug;
          if (!['junior', 'mid', 'senior'].includes(trackSlug))
            throw new ApiRouteError('trackSlug must be junior|mid|senior', 400);
          if (!isNonEmptyString(body.trackTitle))
            throw new ApiRouteError('trackTitle required', 400);
          if (!isNonNegativeInt(body.totalModules))
            throw new ApiRouteError(
              'totalModules must be a non-negative integer',
              400,
            );
          if (!isInt1to5(body.value))
            throw new ApiRouteError('value must be an integer 1-5', 400);
          const comment =
            typeof body.comment === 'string'
              ? body.comment.trim().slice(0, 1000) || null
              : null;

          const { error } = await supabase
            .from('track_feedback')
            .upsert(
              {
                user_id: user.id,
                topic: body.topic,
                track_slug: trackSlug,
                track_title: body.trackTitle,
                total_modules: body.totalModules,
                value: body.value,
                comment,
              },
              { onConflict: 'user_id,topic,track_slug' },
            );
          if (error) throw new ApiRouteError(error.message, 500);
          return { body: { data: { ok: true } }, status: 200 };
        }

        // type === 'practice-set'
        if (!isNonEmptyString(body.topic))
          throw new ApiRouteError('topic required', 400);
        if (!isNonEmptyString(body.moduleId))
          throw new ApiRouteError('moduleId required', 400);
        if (!isNonEmptyString(body.setTitle))
          throw new ApiRouteError('setTitle required', 400);
        if (!isNonNegativeInt(body.tasksSolved))
          throw new ApiRouteError(
            'tasksSolved must be a non-negative integer',
            400,
          );
        if (!isNonNegativeInt(body.totalTasks))
          throw new ApiRouteError(
            'totalTasks must be a non-negative integer',
            400,
          );
        if (!isInt1to5(body.value))
          throw new ApiRouteError('value must be an integer 1-5', 400);

        const { error } = await supabase
          .from('practice_set_feedback')
          .upsert(
            {
              user_id: user.id,
              topic: body.topic,
              module_id: body.moduleId,
              set_title: body.setTitle,
              tasks_solved: body.tasksSolved,
              total_tasks: body.totalTasks,
              value: body.value,
            },
            { onConflict: 'user_id,topic,module_id' },
          );
        if (error) throw new ApiRouteError(error.message, 500);
        return { body: { data: { ok: true } }, status: 200 };
      },
      idempotencyKey,
      ownerKey: user.id,
      requestBody: body,
      scope: `feedback_${type.replace('-', '_')}`,
    }).then((response) =>
      NextResponse.json(response.body, { status: response.status }),
    );
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to submit feedback.');
  }
}
