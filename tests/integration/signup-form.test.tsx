import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '@/components/auth/SignupForm';

const pushMock = vi.fn();
const signUpMock = vi.fn();
const signInWithOAuthMock = vi.fn();

const getPasswordInput = () =>
  screen.getByLabelText(/password/i, { selector: 'input' }) as HTMLInputElement;

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
    expect(
      screen.getByRole('heading', { name: /create your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
  });

  it('keeps submit disabled until all requirements are met', async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    const submit = screen.getByRole('button', { name: /create account/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/full name/i), 'Nedas');
    await user.type(screen.getByLabelText(/email/i), 'nedas@example.com');
    await user.type(getPasswordInput(), 'weak');
    expect(submit).toBeDisabled();

    await user.clear(getPasswordInput());
    await user.type(getPasswordInput(), 'Strong1!');
    expect(submit).toBeEnabled();
  });

  it('submits and redirects when session is returned', async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValueOnce({ session: { user: { id: 'u1' } } });

    render(<SignupForm />);
    await user.type(screen.getByLabelText(/full name/i), '  Nedas  ');
    await user.type(screen.getByLabelText(/email/i), '  nedas@example.com ');
    await user.type(getPasswordInput(), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith(
        'nedas@example.com',
        'Strong1!',
        'Nedas',
        ''
      );
      expect(pushMock).toHaveBeenCalledWith('/flashcards');
    });
  });

  it('shows verification message when signup has no session', async () => {
    const user = userEvent.setup();
    signUpMock.mockResolvedValueOnce({});

    render(<SignupForm />);
    await user.type(screen.getByLabelText(/full name/i), 'Nedas');
    await user.type(screen.getByLabelText(/email/i), 'nedas@example.com');
    await user.type(getPasswordInput(), 'Strong1!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your email to verify your account/i)).toBeInTheDocument();
    });
  });
});
