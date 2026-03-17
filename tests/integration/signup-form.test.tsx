import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/SignupForm';

const pushMock = vi.fn();
const signUpMock = vi.fn();
const signInWithOAuthMock = vi.fn();

// SignupForm now has two password fields: "Password" and "Repeat password".
// Use exact-match regex so we don't get multiple-element ambiguity.
const getPasswordInput = () =>
  screen.getByLabelText(/^password$/i, { selector: 'input' }) as HTMLInputElement;

const getConfirmPasswordInput = () =>
  screen.getByLabelText(/repeat password/i, { selector: 'input' }) as HTMLInputElement;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/lib/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: signUpMock,
    signInWithOAuth: signInWithOAuthMock
  })
}));

describe('SignupForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    signUpMock.mockReset();
    signInWithOAuthMock.mockReset();
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
  });

  it('renders signup headings and fields', () => {
    render(<SignupForm />);
    // Heading and name-field label were updated in the SignupForm redesign
    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nickname/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    // Confirm-password field added in redesign
    expect(getConfirmPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^terms$/i })).toHaveAttribute('href', '/terms');
    // Redesign shortened "Privacy Policy" to "Privacy"
    expect(screen.getByRole('link', { name: /^privacy$/i })).toHaveAttribute('href', '/privacy');
  });

  it('keeps submit disabled until all requirements are met', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const submit = screen.getByRole('button', { name: /create account/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/nickname/i), 'Nedas');
    await user.type(screen.getByLabelText(/email/i), 'nedas@example.com');
    await user.type(getPasswordInput(), 'weak');
    expect(submit).toBeDisabled();

    await user.clear(getPasswordInput());
    await user.type(getPasswordInput(), 'Strong1!');
    // Submit stays disabled until the confirm-password field also matches
    expect(submit).toBeDisabled();

    await user.type(getConfirmPasswordInput(), 'Strong1!');
    expect(submit).toBeEnabled();
  });

  it('submits and redirects to onboarding when session is returned', async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValueOnce({ session: { user: { id: 'u1' } } });

    render(<SignupForm />);
    await user.type(screen.getByLabelText(/nickname/i), '  Nedas  ');
    await user.type(screen.getByLabelText(/email/i), '  nedas@example.com ');
    await user.type(getPasswordInput(), 'Strong1!');
    await user.type(getConfirmPasswordInput(), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        'nedas@example.com',
        'Strong1!',
        'Nedas',
        ''
      );
      expect(pushMock).toHaveBeenCalledWith('/onboarding?signup=1&method=email');
    });
  });

  it('shows verification message when signup has no session', async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValueOnce({});

    render(<SignupForm />);
    await user.type(screen.getByLabelText(/nickname/i), 'Nedas');
    await user.type(screen.getByLabelText(/email/i), 'nedas@example.com');
    await user.type(getPasswordInput(), 'Strong1!');
    await user.type(getConfirmPasswordInput(), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email to verify your account/i)).toBeInTheDocument();
    });
  });
});
