import PS1 from './pyspark/PS1.json';

export interface CheatSheetPattern {
  label: string;
  code: string;
}

export interface CheatSheetSection {
  type: 'concepts' | 'patterns' | 'warnings' | 'insights';
  title: string;
  items: string[] | CheatSheetPattern[];
}

export interface CheatSheet {
  moduleId: string;
  topic: string;
  track: string;
  title: string;
  lessonCount: number;
  estimatedMinutes: number;
  sections: CheatSheetSection[];
}

const ALL_CHEAT_SHEETS: CheatSheet[] = [
  PS1 as unknown as CheatSheet,
];

export function getCheatSheets(topic?: string, track?: string): CheatSheet[] {
  return ALL_CHEAT_SHEETS.filter((cs) => {
    if (topic && cs.topic !== topic) return false;
    if (track && cs.track !== track) return false;
    return true;
  });
}

export function getCheatSheet(moduleId: string): CheatSheet | null {
  return ALL_CHEAT_SHEETS.find((cs) => cs.moduleId === moduleId) ?? null;
}
