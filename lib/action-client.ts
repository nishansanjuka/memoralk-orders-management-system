import { createSafeActionClient } from "next-safe-action";

/**
 * Standard Production-Grade Application Error class.
 * Use this in your services or server actions to throw expected API/domain errors.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    public status: number = 400,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Global next-safe-action client.
 * Normalizes all uncaught or explicit errors to a safe, plain object layout.
 */
export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof AppError) {
      return {
        code: error.code,
        status: error.status,
        message: error.message,
      };
    }

    // Capture standard error details safely, protecting sensitive server traces
    return {
      code: "INTERNAL_SERVER_ERROR",
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected server error occurred",
    };
  },
});

/**
 * Normalized result wrapper representation.
 * Always guarantees plain JSON-serializable objects.
 */
export type ActionResponse<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: { code: string; status: number; message: string; details?: any };
    };

/**
 * Safe client helper to map a raw next-safe-action result to a uniform plain object layout
 * consisting of `{ success: true, data }` or `{ success: false, error }`.
 */
export function handleActionResponse<T>(result: {
  data?: T;
  serverError?: { code: string; status: number; message: string };
  validationErrors?: any;
}): ActionResponse<T> {
  if (result?.serverError) {
    return { success: false, error: result.serverError };
  }
  if (result?.validationErrors) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid input validation check",
        details: result.validationErrors,
      },
    };
  }
  if (result?.data !== undefined) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: {
      code: "UNKNOWN_ERROR",
      status: 500,
      message: "An unknown response structure was returned from the server",
    },
  };
}
