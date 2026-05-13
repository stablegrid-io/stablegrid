import type { ReadingSession } from '@/types/progress';

export const parseLessonIdFromRoute = (
  route: string | null | undefined
): string | null => {
  if (typeof route !== 'string' || !route.includes('?')) {
    return null;
  }
  const [, query = ''] = route.split('?');
  const lessonId = new URLSearchParams(query).get('lesson');
  return lessonId && lessonId.trim().length > 0 ? lessonId : null;
};

export const resolveResumeLessonId = (
  session: Pick<
    ReadingSession,
    'currentLessonId' | 'lastVisitedRoute' | 'sectionsIdsRead'
  >
): string | null => {
  if (session.currentLessonId) {
    return session.currentLessonId;
  }
  const fromRoute = parseLessonIdFromRoute(session.lastVisitedRoute);
  if (fromRoute) {
    return fromRoute;
  }
  const sectionsRead = session.sectionsIdsRead;
  if (Array.isArray(sectionsRead) && sectionsRead.length > 0) {
    return sectionsRead[sectionsRead.length - 1] ?? null;
  }
  return null;
};
