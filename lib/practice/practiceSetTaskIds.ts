import { getPracticeSet } from '@/data/operations/practice-sets';

/**
 * Resolve the ordered list of task IDs for a (topic, moduleId) pair by
 * looking the practice set up in the bundled registry. Used by the
 * auto-completion check ("are ALL canonical tasks now solved?") so the
 * server doesn't trust a client-supplied task count.
 *
 * `moduleId` accepts either form: `"module-PS3"` (canonical) or `"PS3"` (legacy).
 * Returns `[]` when the practice set is missing — caller short-circuits.
 */
export const getPracticeSetTaskIds = (
  topic: string,
  moduleId: string
): string[] => {
  const modulePrefix = moduleId.replace(/^module-/, '');
  const set = getPracticeSet(topic, modulePrefix);
  if (!set) return [];
  return set.tasks.map((task) => task.id);
};
