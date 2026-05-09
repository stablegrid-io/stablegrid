import { permanentRedirect } from 'next/navigation';

export default function LegacyLearnTopicPage() {
  permanentRedirect('/theory');
}
