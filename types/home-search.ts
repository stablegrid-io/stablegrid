export type HomeSearchItemType = 'chapter' | 'function' | 'question';

export interface HomeSearchItem {
  id: string;
  type: HomeSearchItemType;
  topic: string;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
}
