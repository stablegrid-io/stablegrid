import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPasswordIssues } from '@/lib/utils/password';

interface SignupPayload {
  email?: string;
  password?: string;
  name?: string;
  captchaToken?: string;
}

export async function POST(request: Request) {
  let payload: SignupPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const email = payload.email?.trim();
  const password = payload.password ?? '';
  const name = payload.name?.trim();
  const captchaToken = payload.captchaToken;

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const passwordIssues = getPasswordIssues(password);
  if (passwordIssues.length > 0) {
    return NextResponse.json(
      {
        error: `Password requirements not met: ${passwordIssues.join(', ')}.`
      },
      { status: 400 }
    );
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'Captcha verification required.' },
        { status: 400 }
      );
    }

    const verificationBody = new URLSearchParams({
      secret: turnstileSecret,
      response: captchaToken
    });

    const ip = request.headers.get('x-forwarded-for');
    if (ip) {
      verificationBody.append('remoteip', ip.split(',')[0].trim());
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
      return NextResponse.json(
        { error: 'Captcha verification failed. Please try again.' },
        { status: 400 }
      );
    }

    if (!captchaResult.success) {
      return NextResponse.json(
        {
          error: 'Captcha verification failed. Please try again.'
        },
        { status: 400 }
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Captcha is not configured on the server.' },
      { status: 500 }
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
