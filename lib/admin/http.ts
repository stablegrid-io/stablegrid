import { NextResponse } from 'next/server';
import { ApiRouteError } from '@/lib/api/http';
import { AdminAccessError } from '@/lib/admin/access';
import { AdminServiceError } from '@/lib/admin/service';
import { ActivationServiceError } from '@/lib/activation/service';

export const parseJsonBody = async (request: Request) => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new AdminServiceError('Invalid request body.', 400);
  }
};

export const toAdminErrorResponse = (error: unknown, fallbackMessage: string) => {
  if (
    error instanceof AdminAccessError ||
    error instanceof AdminServiceError ||
    error instanceof ActivationServiceError ||
    error instanceof ApiRouteError
  ) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error instanceof AdminServiceError ||
        error instanceof ActivationServiceError ||
        error instanceof ApiRouteError
          ? error.details ?? {}
          : {})
      },
      {
        status: error.status,
        headers: error instanceof ApiRouteError ? error.headers : undefined
      }
    );
  }

  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : fallbackMessage
    },
    { status: 500 }
  );
};
