import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/auth/LoginForm';

const pushMock = vi.fn();
const signInMock = vi.fn();
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
    signIn: signInMock,
    signInWithOAuth: signInWithOAuthMock
  })
}));

describe('LoginForm', () => {
  beforeEach(() => {
    pushMock.mockReset();
    signInMock.mockReset();
    signInWithOAuthMock.mockReset();
  });

  it('renders base sections', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^google$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^github$/i })).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const input = getPasswordInput();
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('submits credentials and redirects to flashcards', async () => {
    const user = userEvent.setup();
    signInMock.mockResolvedValueOnce({});

    render(<LoginForm />);
    await user.type(screen.getByLabelText(/email/i), '  user@example.com  ');
    await user.type(getPasswordInput(), 'SecurePass1!');
    await user.click(screen.getByRole('button', { name: /^log in$/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('user@example.com', 'SecurePass1!');
      expect(pushMock).toHaveBeenCalledWith('/flashcards');
    });
  });

  it('shows OAuth error message', async () => {
    const user = userEvent.setup();
    signInWithOAuthMock.mockRejectedValueOnce(new Error('OAuth failed'));

    render(<LoginForm />);
    await user.click(screen.getByRole('button', { name: /^google$/i }));

    await waitFor(() => {
      expect(screen.getByText(/oauth failed/i)).toBeInTheDocument();
    });
  });
});
