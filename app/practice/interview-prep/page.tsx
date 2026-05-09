import type { Metadata } from 'next';
import { ComingSoonCategory } from '../_components/ComingSoonCategory';

export const metadata: Metadata = {
  title: 'Interview Prep — StableGrid',
  description:
    'Whiteboard-style PySpark questions framed the way interviewers actually ask them.',
  alternates: { canonical: '/practice/interview-prep' },
  robots: { index: false, follow: false }
};

export default function InterviewPrepPage() {
  return (
    <ComingSoonCategory
      eyebrow="Interview Prep"
      title="Time-boxed, interview-flavored."
      description="Whiteboard-style PySpark questions framed the way interviewers actually ask them. Constraints, edge cases, follow-ups."
    />
  );
}
