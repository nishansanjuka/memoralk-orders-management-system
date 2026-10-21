"use server";

import { auth } from "@clerk/nextjs/server";
import { AppError } from "@/lib/action-client";

/**
 * Asserts that the caller is authenticated via Clerk.
 * Throws an AppError with 401 status if not authenticated.
 */
export async function assertAuthenticatedUser(): Promise<{
  userId: string;
  sessionId: string | null;
}> {
  const { userId, sessionId } = await auth();

  if (!userId) {
    throw new AppError(
      "UNAUTHORIZED",
      401,
      "You must be signed in to perform this operation.",
    );
  }

  return { userId, sessionId: sessionId ?? null };
}

/**
 * Returns the current authenticated session or null without throwing.
 */
export async function getAuthSession(): Promise<{
  userId: string | null;
  sessionId: string | null;
}> {
  try {
    const session = await auth();
    return {
      userId: session.userId ?? null,
      sessionId: session.sessionId ?? null,
    };
  } catch {
    return { userId: null, sessionId: null };
  }
}
