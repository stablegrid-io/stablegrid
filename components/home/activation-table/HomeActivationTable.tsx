'use client';

import { ActivationTable } from '@/components/home/activation-table/ActivationTable';
import type { HomeActivationTableData } from '@/components/home/activation-table/types';

export interface HomeActivationTableProps {
  data: HomeActivationTableData;
  featureEnabled?: boolean;
}

export const HomeActivationTable = ({
  data: _data,
  featureEnabled = true
}: HomeActivationTableProps) => {
  void _data;

  if (!featureEnabled) return null;

  return <ActivationTable />;
};
