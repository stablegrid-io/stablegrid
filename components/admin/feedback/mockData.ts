import type { FeedbackRecord } from '@/components/admin/feedback/types';

export const FEEDBACK_REFERENCE_DATE = '2026-03-15T12:00:00.000Z';

const MOCK_FEEDBACK_BASE: Array<Omit<FeedbackRecord, 'sourceId' | 'sourceType'>> = [
  {
    id: 'feedback_001',
    userName: 'Rasa Petraitis',
    userEmail: 'rasa@stablegrid.test',
    submittedAt: '2026-03-14T09:12:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Onboarding',
    status: 'Submitted',
    module: 'Onboarding',
    linkedPage: '/signup',
    preview: 'Setup steps feel unclear when I return after a break.',
    message:
      'I left midway through setup and came back later, but the checklist reset in a way that made me feel lost. The next recommended step should stay pinned with a short explanation.',
    internalNotes:
      'Repeated confusion after returning to onboarding. Validate resume-state handling.',
    keywords: ['onboarding', 'resume flow', 'clarity']
  },
  {
    id: 'feedback_002',
    userName: 'Jonas Vale',
    userEmail: 'jonas@stablegrid.test',
    submittedAt: '2026-03-13T15:25:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Theory Experience',
    status: 'Resolved',
    module: 'Theory',
    linkedPage: '/theory',
    preview: 'Theory lessons now feel calm, focused, and much easier to finish.',
    message:
      'The reading rhythm in theory is excellent now. I can move through lessons without losing context, and the progress state makes the whole module feel dependable.',
    internalNotes: 'Use as a reference quote for future theory UX decisions.',
    keywords: ['theory', 'focus', 'progress']
  },
  {
    id: 'feedback_003',
    userName: 'Milda Cross',
    userEmail: 'milda@stablegrid.test',
    submittedAt: '2026-03-12T11:08:00.000Z',
    type: 'Issue',
    rating: 1,
    sentiment: 'Negative',
    category: 'Performance',
    status: 'Reviewed',
    module: 'Task Pages',
    linkedPage: '/home',
    preview: 'Task pages take too long to open on older laptops.',
    message:
      'Every task page takes a few seconds before content settles. It feels especially slow on an older laptop, and the delay is enough that I second-guess whether the click worked.',
    internalNotes:
      'Correlates with recent loading complaints after content-heavy task updates.',
    keywords: ['slow loading', 'task pages', 'performance']
  },
  {
    id: 'feedback_004',
    userName: 'Austeja Reed',
    userEmail: 'austeja@stablegrid.test',
    submittedAt: '2026-03-11T18:46:00.000Z',
    type: 'Usability',
    rating: 3,
    sentiment: 'Neutral',
    category: 'Navigation',
    status: 'Reviewed',
    module: 'Dashboard',
    linkedPage: '/home',
    preview: 'I can find most things, but the next action is not always obvious.',
    message:
      'The dashboard looks polished, but I still have to pause and decide where to go next. A little more guidance around the next recommended action would help a lot.',
    internalNotes: 'Related to ongoing home prioritization work.',
    keywords: ['navigation', 'next step', 'dashboard']
  },
  {
    id: 'feedback_005',
    userName: 'Emil Hart',
    userEmail: 'emil@stablegrid.test',
    submittedAt: '2026-03-10T13:02:00.000Z',
    type: 'Feature Request',
    rating: 4,
    sentiment: 'Positive',
    category: 'Missions',
    status: 'Submitted',
    module: 'Missions',
    linkedPage: '/missions',
    preview: 'Pinning a current mission would make returning to work much easier.',
    message:
      'The mission flow is strong, but I would love a small pin or save state for the mission I am actively working through so I can jump back in faster.',
    internalNotes: 'Good candidate for low-lift continuity improvement.',
    keywords: ['missions', 'continuity', 'save state']
  },
  {
    id: 'feedback_006',
    userName: 'Lina Gray',
    userEmail: 'lina@stablegrid.test',
    submittedAt: '2026-03-08T08:17:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Onboarding',
    status: 'Submitted',
    module: 'Onboarding',
    linkedPage: '/signup',
    preview: 'The first-week checklist asks for too much context too early.',
    message:
      'I wanted to explore before committing to a setup path, but the first-week checklist pushed me to make decisions I did not understand yet. A lighter first pass would help.',
    internalNotes: 'Second onboarding complaint this week about early decision load.',
    keywords: ['onboarding', 'checklist', 'setup friction']
  },
  {
    id: 'feedback_007',
    userName: 'Nora Lane',
    userEmail: 'nora@stablegrid.test',
    submittedAt: '2026-03-07T10:39:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Billing',
    status: 'Resolved',
    module: 'Billing',
    linkedPage: '/pricing',
    preview: 'Billing details are finally clear enough that I do not need support.',
    message:
      'The billing page is straightforward now. Renewal timing, plan details, and invoices are easy to scan, which removed a lot of uncertainty for me.',
    internalNotes: 'Useful validation for recent billing clarity polish.',
    keywords: ['billing', 'clarity', 'renewal']
  },
  {
    id: 'feedback_008',
    userName: 'Theo Marsh',
    userEmail: 'theo@stablegrid.test',
    submittedAt: '2026-03-04T16:05:00.000Z',
    type: 'Usability',
    rating: 3,
    sentiment: 'Neutral',
    category: 'Task Flow',
    status: 'Reviewed',
    module: 'Grid Ops',
    linkedPage: '/grid-ops',
    preview: 'Grid Ops is powerful, but the handoff between steps could be smoother.',
    message:
      'I like the challenge, but the transition between actions in Grid Ops still feels abrupt. A calmer sense of progress between stages would make it easier to stay oriented.',
    internalNotes: 'Potential fit for progress markers or calmer transition copy.',
    keywords: ['grid ops', 'workflow', 'orientation']
  },
  {
    id: 'feedback_009',
    userName: 'Mason Cole',
    userEmail: 'mason@stablegrid.test',
    submittedAt: '2026-03-02T12:54:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Performance',
    status: 'Reviewed',
    module: 'Task Pages',
    linkedPage: '/practice/notebooks',
    preview:
      'Notebook autosave feels delayed enough that I hesitate before switching tabs.',
    message:
      'When I finish a note and move on quickly, I am not fully confident it saved. The delay makes the experience feel heavier than it should, even when nothing is lost.',
    internalNotes: 'Pair with notebook persistence telemetry for deeper review.',
    keywords: ['slow loading', 'autosave', 'notebooks']
  },
  {
    id: 'feedback_010',
    userName: 'Sofia Webb',
    userEmail: 'sofia@stablegrid.test',
    submittedAt: '2026-02-27T14:19:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Theory Experience',
    status: 'Resolved',
    module: 'Theory',
    linkedPage: '/theory/module/traffic-basics',
    preview: 'Theory checkpoints make progress feel tangible without breaking focus.',
    message:
      'I really like the checkpoint rhythm in theory. It gives me confidence that I am moving forward, but it never interrupts the flow of reading.',
    internalNotes: 'Consistent with theory satisfaction trend.',
    keywords: ['theory', 'checkpoints', 'focus']
  },
  {
    id: 'feedback_011',
    userName: 'Arun Patel',
    userEmail: 'arun@stablegrid.test',
    submittedAt: '2026-02-22T09:41:00.000Z',
    type: 'Praise',
    rating: 4,
    sentiment: 'Positive',
    category: 'Onboarding',
    status: 'Resolved',
    module: 'Onboarding',
    linkedPage: '/signup',
    preview: 'The guided setup finally explains why each choice matters.',
    message:
      'The newest onboarding copy is much better. I still needed a second look in one step, but the why behind each choice is more obvious now.',
    internalNotes: 'Positive signal after onboarding copy refresh.',
    keywords: ['onboarding', 'guidance', 'copy']
  },
  {
    id: 'feedback_012',
    userName: 'Noah Quinn',
    userEmail: 'noah@stablegrid.test',
    submittedAt: '2026-02-18T17:33:00.000Z',
    type: 'Issue',
    rating: 1,
    sentiment: 'Negative',
    category: 'Performance',
    status: 'Ignored',
    module: 'Dashboard',
    linkedPage: '/home',
    preview: 'Home widgets feel sluggish after I complete a few actions in a row.',
    message:
      'After a few interactions, the home dashboard starts to feel sticky. The content eventually catches up, but the lag breaks trust in the interface.',
    internalNotes:
      'Needs validation after latest dashboard refresh. Previously marked as cannot reproduce.',
    keywords: ['slow loading', 'dashboard', 'performance']
  },
  {
    id: 'feedback_013',
    userName: 'Iris Holt',
    userEmail: 'iris@stablegrid.test',
    submittedAt: '2026-02-13T07:58:00.000Z',
    type: 'Praise',
    rating: 4,
    sentiment: 'Positive',
    category: 'Navigation',
    status: 'Resolved',
    module: 'Dashboard',
    linkedPage: '/home',
    preview: 'The home navigation feels cleaner and much less noisy than before.',
    message:
      'The lighter navigation structure helps me stay calm. There is still plenty to do, but it feels organized instead of crowded.',
    internalNotes: 'Supportive feedback after nav simplification work.',
    keywords: ['navigation', 'clarity', 'home']
  },
  {
    id: 'feedback_014',
    userName: 'Lea Morgan',
    userEmail: 'lea@stablegrid.test',
    submittedAt: '2026-02-08T20:11:00.000Z',
    type: 'Usability',
    rating: 3,
    sentiment: 'Neutral',
    category: 'Onboarding',
    status: 'Reviewed',
    module: 'Onboarding',
    linkedPage: '/signup',
    preview: 'I want a faster path when I already know what I need.',
    message:
      'The guided onboarding is helpful, but there should be a cleaner express path for returning professionals who already know their preferred setup.',
    internalNotes: 'Potential segmented onboarding mode.',
    keywords: ['onboarding', 'express path', 'setup']
  },
  {
    id: 'feedback_015',
    userName: 'Caleb Frost',
    userEmail: 'caleb@stablegrid.test',
    submittedAt: '2026-01-31T10:24:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Task Flow',
    status: 'Submitted',
    module: 'Task Pages',
    linkedPage: '/practice/notebooks',
    preview: 'The jump between notebook tasks is abrupt and hard to track.',
    message:
      'I often finish one notebook task and then lose my sense of place. The transition to the next task could do more to preserve context and confidence.',
    internalNotes: 'Match against notebook progression feedback from March.',
    keywords: ['task pages', 'context', 'transition']
  },
  {
    id: 'feedback_016',
    userName: 'Mia Rhodes',
    userEmail: 'mia@stablegrid.test',
    submittedAt: '2026-01-25T14:44:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Theory Experience',
    status: 'Resolved',
    module: 'Theory',
    linkedPage: '/theory/module/airspace',
    preview: 'Theory is the strongest part of the product right now.',
    message:
      'The lesson structure, checkpoint pacing, and visual calm in theory make it the area I return to most confidently. It feels finished in the best way.',
    internalNotes: 'Strong qualitative validation for theory module direction.',
    keywords: ['theory', 'confidence', 'structure']
  },
  {
    id: 'feedback_017',
    userName: 'Evan Shaw',
    userEmail: 'evan@stablegrid.test',
    submittedAt: '2026-01-17T08:26:00.000Z',
    type: 'Issue',
    rating: 2,
    sentiment: 'Negative',
    category: 'Billing',
    status: 'Reviewed',
    module: 'Billing',
    linkedPage: '/pricing',
    preview: 'Invoice history took too many clicks to reach from account settings.',
    message:
      'I eventually found my invoice history, but it felt more buried than it should be. Important billing details should be reachable in one obvious step.',
    internalNotes: 'Navigation issue inside billing settings, not payment reliability.',
    keywords: ['billing', 'invoices', 'navigation']
  },
  {
    id: 'feedback_018',
    userName: 'Olive Hart',
    userEmail: 'olive@stablegrid.test',
    submittedAt: '2026-01-07T09:03:00.000Z',
    type: 'Praise',
    rating: 4,
    sentiment: 'Positive',
    category: 'Onboarding',
    status: 'Resolved',
    module: 'Onboarding',
    linkedPage: '/signup',
    preview: 'The guided setup feels friendlier than older admin-style forms.',
    message:
      'The product feels much more welcoming now. Setup still has a lot of decisions, but the tone is calmer and more human than the older version.',
    internalNotes: 'Positive tone validation for onboarding language.',
    keywords: ['onboarding', 'tone', 'setup']
  },
  {
    id: 'feedback_019',
    userName: 'Harper Dean',
    userEmail: 'harper@stablegrid.test',
    submittedAt: '2025-12-29T11:57:00.000Z',
    type: 'Praise',
    rating: 5,
    sentiment: 'Positive',
    category: 'Task Flow',
    status: 'Resolved',
    module: 'Grid Ops',
    linkedPage: '/grid-ops',
    preview: 'Grid Ops feels demanding in a good way and keeps me engaged.',
    message:
      'The structure in Grid Ops pushes me just enough. It feels like work, but in a way that makes progress noticeable rather than exhausting.',
    internalNotes: 'Strong positive signal for Grid Ops pacing.',
    keywords: ['grid ops', 'engagement', 'progress']
  },
  {
    id: 'feedback_020',
    userName: 'Eli Porter',
    userEmail: 'eli@stablegrid.test',
    submittedAt: '2025-12-16T13:18:00.000Z',
    type: 'Feature Request',
    rating: 3,
    sentiment: 'Neutral',
    category: 'Missions',
    status: 'Reviewed',
    module: 'Missions',
    linkedPage: '/missions',
    preview: 'Mission history would be more useful with a lightweight timeline.',
    message:
      'I can see what I completed, but I would love a slightly clearer timeline view for my mission history so I can understand how my progress compounds over time.',
    internalNotes: 'Could become a simple mission history enhancement.',
    keywords: ['missions', 'history', 'timeline']
  }
];

export const MOCK_FEEDBACK_RECORDS: FeedbackRecord[] = MOCK_FEEDBACK_BASE.map(
  (record) => ({
    ...record,
    sourceId: record.id,
    sourceType: 'bug_report'
  })
);
