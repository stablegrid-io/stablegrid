export const PRODUCT_EVENT_NAMES = [
  'landing_cta',
  'signup_started',
  'signup_completed',
  'onboarding_completed',
  'chapter_started',
  'first_chapter_started',
  'chapter_completed',
  'first_chapter_completed',
  'practice_session_started',
  'practice_session_completed',
  'first_practice_completed',
  'grid_ops_opened',
  'grid_asset_deployed',
  'first_grid_deploy',
  'home_primary_action_clicked',
  'career_ladder_stage_viewed',
  'promotion_criterion_clicked',
  'development_task_started'
] as const;

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number];
