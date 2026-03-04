'use client';

import { useEffect } from 'react';
import { getOrCreateProductSessionId } from '@/lib/analytics/productAnalytics';

export function ProductAnalyticsBootstrap() {
  useEffect(() => {
    getOrCreateProductSessionId();
  }, []);

  return null;
}
