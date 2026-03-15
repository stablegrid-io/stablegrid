import { NextResponse } from 'next/server';
import { ApiRouteError, parseJsonObject, toApiErrorResponse } from '@/lib/api/http';
import { enforceRateLimit, getClientIp } from '@/lib/api/protection';
import { createClient } from '@/lib/supabase/server';
import { getPasswordIssues } from '@/lib/utils/password';

interface SignupPayload {
  email: string;
  password: string;
  name: string;
  captchaToken: string;
}

const parseSignupPayload = async (request: Request) => {
  const payload = await parseJsonObject(request);
  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const captchaToken =
    typeof payload.captchaToken === 'string' ? payload.captchaToken : '';

  if (!email || !password || !name) {
    throw new ApiRouteError('Missing required fields.', 400);
  }

  return {
    captchaToken,
    email,
    name,
    password
  } satisfies SignupPayload;
};

export async function POST(request: Request) {
  try {
    const payload = await parseSignupPayload(request);
    const clientIp = getClientIp(request);

    const passwordIssues = getPasswordIssues(payload.password);
    if (passwordIssues.length > 0) {
      throw new ApiRouteError(
        `Password requirements not met: ${passwordIssues.join(', ')}.`,
        400
      );
    }

    await Promise.all([
      enforceRateLimit({
        scope: 'auth_signup_email',
        key: payload.email.toLowerCase(),
        limit: 3,
        windowSeconds: 60 * 60
      }),
      enforceRateLimit({
        scope: 'auth_signup_ip',
        key: clientIp,
        limit: 5,
        windowSeconds: 15 * 60
      })
    ]);

    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!payload.captchaToken) {
        throw new ApiRouteError('Captcha verification required.', 400);
      }

      const verificationBody = new URLSearchParams({
        secret: turnstileSecret,
        response: payload.captchaToken
      });

      if (clientIp) {
        verificationBody.append('remoteip', clientIp);
      }

      let captchaResult: { success: boolean; ['error-codes']?: string[] };
      try {
        const captchaResponse = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: verificationBody
          }
        );
        captchaResult = (await captchaResponse.json()) as {
          success: boolean;
          ['error-codes']?: string[];
        };
      } catch {
        throw new ApiRouteError('Captcha verification failed. Please try again.', 400);
      }

      if (!captchaResult.success) {
        throw new ApiRouteError('Captcha verification failed. Please try again.', 400);
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new ApiRouteError('Captcha is not configured on the server.', 500);
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { name: payload.name }
      }
    });

    if (error) {
      throw new ApiRouteError(error.message, 400);
    }

    return NextResponse.json(data);
  } catch (error) {
    return toApiErrorResponse(error, 'Failed to create account.');
  }
}
