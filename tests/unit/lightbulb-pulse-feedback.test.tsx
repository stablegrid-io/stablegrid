import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LightbulbPulseFeedback } from '@/components/feedback/LightbulbPulseFeedback';

const trackProductEventMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/analytics/productAnalytics', () => ({
  trackProductEvent: (...args: unknown[]) => trackProductEventMock(...args)
}));

describe('LightbulbPulseFeedback', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    trackProductEventMock.mockClear();
  });

  it('submits one-click feedback and persists selection in session storage', async () => {
    const user = userEvent.setup();
    render(
      <LightbulbPulseFeedback
        contextType="module"
        contextId="pyspark:module-01"
        prompt="How was this module checkpoint?"
      />
    );

    const brightOption = screen.getByRole('button', { name: /very clear/i });
    await user.click(brightOption);

    expect(trackProductEventMock).toHaveBeenCalledWith('lightbulb_feedback_submitted', {
      feedbackType: 'lightbulb',
      contextType: 'module',
      contextId: 'pyspark:module-01',
      value: 'bright'
    });
    expect(window.sessionStorage.getItem('stablegrid-lightbulb-feedback:module:pyspark:module-01')).toBe('bright');
    expect(screen.getByText('Feedback saved.')).toBeInTheDocument();
  });

  it('hydrates previously selected feedback from session storage', async () => {
    window.sessionStorage.setItem('stablegrid-lightbulb-feedback:general:home-dashboard', 'steady');

    render(
      <LightbulbPulseFeedback
        contextType="general"
        contextId="home-dashboard"
        prompt="Station pulse"
      />
    );

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /clear enough/i })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    );
    expect(trackProductEventMock).not.toHaveBeenCalled();
  });

  it('hides widget when dismiss mode is enabled and feedback already exists', () => {
    window.sessionStorage.setItem('stablegrid-lightbulb-feedback:general:home-dashboard', 'steady');

    const { queryByRole } = render(
      <LightbulbPulseFeedback
        contextType="general"
        contextId="home-dashboard"
        prompt="Station pulse"
        dismissWhenSelected
      />
    );

    expect(queryByRole('button', { name: /needs work/i })).not.toBeInTheDocument();
  });
});
