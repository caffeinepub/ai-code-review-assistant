/**
 * ReviewPage — main split-panel layout for the AI Code Review Assistant.
 *
 * Layout:
 *   - Left panel (60%): CodeEditor — code input, language picker, submit
 *   - Right panel (40%): ReviewResults — analysis output, loading, error states
 *
 * State flows through useCodeReview hook; this page only coordinates
 * local UI state (code, language) with the review mutation.
 */
import { CodeEditor } from "@/components/CodeEditor";
import { ReviewResults } from "@/components/ReviewResults";
import { useCodeReview } from "@/hooks/useCodeReview";
import type { Language } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";
import { useCallback, useState } from "react";

export function ReviewPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const { reviewState, analyze, reset } = useCodeReview();

  /** Submit current code for analysis. Skips if code is empty or already loading. */
  const handleAnalyze = useCallback(() => {
    if (!code.trim() || reviewState.status === "loading") return;
    analyze({ code, language });
  }, [code, language, analyze, reviewState.status]);

  /**
   * Reset to idle then immediately re-run analysis if code is present.
   * Used by the retry button in the error state.
   */
  const handleRetry = useCallback(() => {
    reset();
    if (code.trim()) {
      // Small timeout lets React flush the reset before starting a new mutation.
      setTimeout(() => analyze({ code, language }), 0);
    }
  }, [reset, code, language, analyze]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  const isLoading = reviewState.status === "loading";

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      {/* ── Main split panel ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left panel: Code Editor (60%) */}
        <div
          className="flex flex-col md:w-[60%] border-b md:border-b-0 md:border-r border-border overflow-hidden"
          style={{ minHeight: "45vh" }}
          data-ocid="editor-panel"
        >
          <CodeEditor
            code={code}
            language={language}
            onCodeChange={setCode}
            onLanguageChange={handleLanguageChange}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
          />
        </div>

        {/* Right panel: Results (40%) */}
        <div
          className="flex flex-col md:w-[40%] overflow-y-auto bg-background"
          style={{ minHeight: "45vh" }}
          data-ocid="results-panel-wrapper"
        >
          {/* Panel header bar */}
          <div
            className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0"
            aria-live="polite"
          >
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Analysis Results
            </span>
            {reviewState.status === "success" && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-chart-4">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-chart-4"
                  aria-hidden="true"
                />
                Complete
              </span>
            )}
            {reviewState.status === "loading" && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-accent">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"
                  aria-hidden="true"
                />
                Analyzing…
              </span>
            )}
            {reviewState.status === "error" && (
              <span className="ml-auto flex items-center gap-1 text-[10px] font-mono text-destructive">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-destructive"
                  aria-hidden="true"
                />
                Failed
              </span>
            )}
          </div>

          <ReviewResults reviewState={reviewState} onRetry={handleRetry} />
        </div>
      </div>
    </div>
  );
}
