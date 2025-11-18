import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors?: any) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
  };
}

export function formatZodError(error: ZodError): ErrorResponse {
  return {
    error: {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      statusCode: 400,
      details: error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      })),
    },
  };
}

export function formatError(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error instanceof ValidationError ? error.errors : undefined,
      },
    };
  }

  if (error instanceof ZodError) {
    return formatZodError(error);
  }

  if (error instanceof Error) {
    return {
      error: {
        message: error.message,
        statusCode: 500,
      },
    };
  }

  return {
    error: {
      message: "An unknown error occurred",
      statusCode: 500,
    },
  };
}
