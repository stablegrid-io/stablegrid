export type SettingsTabId =
  | 'profile'
  | 'security'
  | 'billing'
  | 'reading'
  | 'notifs'
  | 'danger'
  | 'privacy'
  | 'terms'
  | 'support'
  | 'bug';

export interface NotificationPrefs {
  streak_reminder: boolean;
  weekly_digest: boolean;
  new_content: boolean;
  practice_reminder: boolean;
  marketing: boolean;
}

export interface ProfileRecord {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
  notification_prefs: NotificationPrefs | null;
}

export interface SubscriptionRecord {
  plan: string | null;
  status: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_sub_id: string | null;
}

export interface ToastPayload {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}
