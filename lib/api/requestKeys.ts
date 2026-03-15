const sanitizePart = (value: string | number | boolean | null | undefined) =>
  String(value ?? '')
    .trim()
    .replace(/[^a-zA-Z0-9:_,-]/g, '_');

const sortJsonValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((entry) => sortJsonValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = sortJsonValue((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
};

const stableStringify = (value: unknown) => JSON.stringify(sortJsonValue(value));

const hashString = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
};

export const createPayloadRequestKey = (scope: string, payload: unknown) =>
  `${sanitizePart(scope)}:${hashString(stableStringify(payload))}`;

export const createGridOpsDeployRequestKey = ({
  scenarioId,
  turnIndex,
  assetId
}: {
  scenarioId: string;
  turnIndex: number;
  assetId: string;
}) =>
  `grid_ops:${sanitizePart(scenarioId)}:${sanitizePart(turnIndex)}:${sanitizePart(assetId)}`;

export const createMissionProgressRequestKey = ({
  missionSlug,
  state,
  unlocked
}: {
  missionSlug: string;
  state: string;
  unlocked: boolean;
}) =>
  `mission:${sanitizePart(missionSlug)}:${sanitizePart(state)}:${unlocked ? '1' : '0'}`;

export const createNotebookProgressRequestKey = (
  completedNotebookIds: Iterable<string>
) => {
  const normalizedIds = Array.from(
    new Set(
      Array.from(completedNotebookIds)
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    )
  ).sort();

  return `notebooks:${normalizedIds.map((value) => sanitizePart(value)).join(',') || 'empty'}`;
};
