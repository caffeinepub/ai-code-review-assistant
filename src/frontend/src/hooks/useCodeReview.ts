/**
 * useCodeReview — wraps the backend analyzeCode actor call in a React Query mutation.
 *
 * Returns:
 *   - reviewState: current status + data/error (idle | loading | success | error)
 *   - analyze: function to trigger analysis
 *   - reset: reset mutation back to idle
 *   - isActorReady: true when the actor is initialized and not loading
 *
 * Error handling:
 *   - Actor not ready → user-friendly "not ready" message
 *   - Backend returns err variant → extracts the error string
 *   - Network / unexpected errors → mutation.error.message surfaced in reviewState
 *   - Code length > 50,000 chars → rejected before the call is made
 */
import { createActor } from "@/backend";
import type { ReviewState } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";

/** Maximum code length accepted by the backend (bytes). */
const MAX_CODE_LENGTH = 50_000;

/**
 * Maps a raw backend/network error string to a user-friendly message.
 * Rate limit, API key, cycles, and canister errors each get a specific message.
 */
function classifyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "Rate limit reached: you've hit Google's free tier limit (15 requests/min). Wait 1-2 minutes and try again.";
  }
  if (
    lower.includes("api key") ||
    lower.includes("invalid_argument") ||
    lower.includes("api_key_invalid") ||
    (lower.includes("400") && lower.includes("key")) ||
    lower.includes("401") ||
    lower.includes("403")
  ) {
    return "The AI service key is temporarily unavailable. Try again in a moment.";
  }
  if (lower.includes("cycles")) {
    return "Analysis failed due to insufficient processing resources. Try again.";
  }
  if (lower.includes("ic0508") || lower.includes("stopped")) {
    return "The backend service is temporarily unavailable. Try again in a moment.";
  }
  return raw || "An unexpected error occurred. Please try again.";
}

interface AnalyzeCodeParams {
  code: string;
  language: string;
}

export function useCodeReview() {
  const { actor, isFetching } = useActor(createActor);

  // Derive actor readiness — true only when fully initialized.
  const isActorReady = !!actor && !isFetching;

  const mutation = useMutation<ReviewState, Error, AnalyzeCodeParams>({
    mutationFn: async ({ code, language }): Promise<ReviewState> => {
      // Guard: actor must be ready before attempting a call.
      if (!actor || isFetching) {
        return {
          status: "error",
          data: null,
          error:
            "The AI service is still initializing. Please wait a moment and try again.",
        };
      }

      // Guard: reject oversized code to avoid unnecessary backend calls.
      if (code.length > MAX_CODE_LENGTH) {
        return {
          status: "error",
          data: null,
          error: `Code is too long (${code.length.toLocaleString()} chars). Maximum is ${MAX_CODE_LENGTH.toLocaleString()} characters.`,
        };
      }

      try {
        const result = await actor.analyzeCode(code, language);

        if (result.__kind__ === "ok") {
          return {
            status: "success",
            data: result.ok,
            error: null,
          };
        }

        // Backend returned an error variant — map to friendly message.
        const rawErr = result.err ?? "";
        return {
          status: "error",
          data: null,
          error: classifyError(rawErr),
        };
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        return {
          status: "error",
          data: null,
          error: classifyError(raw),
        };
      }
    },
  });

  // Derive ReviewState from mutation state so callers get a single source of truth.
  const reviewState: ReviewState = (() => {
    if (mutation.isPending) {
      return { status: "loading", data: null, error: null };
    }
    if (mutation.isSuccess) {
      // mutationFn itself returns a ReviewState — use it directly.
      return mutation.data;
    }
    if (mutation.isError) {
      return {
        status: "error",
        data: null,
        error: mutation.error.message,
      };
    }
    return { status: "idle", data: null, error: null };
  })();

  return {
    reviewState,
    analyze: mutation.mutate,
    reset: mutation.reset,
    isActorReady,
  };
}
