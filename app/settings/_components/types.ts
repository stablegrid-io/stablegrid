export type SettingsTabId =
  | 'profile'
  | 'billing'
  | 'reading'
  | 'danger'
  | 'privacy'
  | 'terms'
  | 'support'
  | 'bug';

export interface ProfileRecord {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string | null;
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
