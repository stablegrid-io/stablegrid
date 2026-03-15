import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeActivationTable } from '@/components/home/activation-table/HomeActivationTable';
import type { HomeActivationTableProps } from '@/components/home/activation-table/HomeActivationTable';

vi.mock('@/components/home/activation-table/ActivationTable', () => ({
  ActivationTable: () => <div data-testid="activation-table-mock">Activation table</div>
}));

const buildProps = (): HomeActivationTableProps => ({
  featureEnabled: true,
  data: {
    greeting: {
      title: 'unused',
      subtitle: 'unused'
    },
    categories: []
  }
});

describe('HomeActivationTable', () => {
  it('renders ActivationTable when the feature is enabled', () => {
    render(<HomeActivationTable {...buildProps()} />);

    expect(screen.getByTestId('activation-table-mock')).toBeInTheDocument();
  });

  it('returns null when feature flag is disabled', () => {
    render(
      <HomeActivationTable
        {...buildProps()}
        featureEnabled={false}
      />
    );

    expect(screen.queryByTestId('activation-table-mock')).not.toBeInTheDocument();
  });
});
