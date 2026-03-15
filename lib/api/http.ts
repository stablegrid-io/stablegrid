import { NextResponse } from 'next/server';

export type JsonObject = Record<string, unknown>;

interface ApiRouteErrorOptions {
  details?: JsonObject;
  headers?: HeadersInit;
}

export class ApiRouteError extends Error {
  status: number;
  details?: JsonObject;
  headers?: HeadersInit;

  constructor(message: string, status: number, options: ApiRouteErrorOptions = {}) {
    super(message);
    this.status = status;
    this.details = options.details;
    this.headers = options.headers;
  }
}

export const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseJsonObject = async (
  request: Request,
  errorMessage: string = 'Invalid request body.'
): Promise<JsonObject> => {
  try {
    const payload = await request.json();
    if (!isJsonObject(payload)) {
      throw new ApiRouteError(errorMessage, 400);
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiRouteError) {
      throw error;
    }

    throw new ApiRouteError(errorMessage, 400);
  }
};

export const toApiErrorResponse = (error: unknown, fallbackMessage: string) => {
  if (error instanceof ApiRouteError) {
    return NextResponse.json(
      {
        error: error.message,
        ...(error.details ?? {})
      },
      {
        status: error.status,
        headers: error.headers
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
