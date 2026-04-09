/**
 * ReviewResults — renders the four analysis category cards + quality score.
 *
 * Handles all four ReviewState states:
 *   - loading  → animated skeleton cards
 *   - error    → actionable error message + retry button
 *   - idle     → EmptyState onboarding prompt
 *   - success  → CategoryCard sections + QualityScore
 *
 * bigint→number conversion for qualityScore happens here (at the render
 * boundary) via Number(), before any arithmetic or display operations.
 */
import { CategoryCard } from "@/components/CategoryCard";
import { EmptyState } from "@/components/EmptyState";
import { QualityScore } from "@/components/QualityScore";
import { Button } from "@/components/ui/button";
import type { ReviewState } from "@/types";
import {
  AlertTriangle,
  BookOpen,
  Bug,
  Clock,
  KeyRound,
  Lightbulb,
  RefreshCw,
  Shield,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";

interface ReviewResultsProps {
  reviewState: ReviewState;
  onRetry: () => void;
}

/** Severity→class mapping — covers backend values: critical, warning, info, high, medium, low. */
const SEVERITY_VARIANTS: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  warning: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  medium: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  info: "bg-accent/20 text-accent border-accent/30",
  low: "bg-accent/20 text-accent border-accent/30",
};

function SeverityBadge({ severity }: { severity: string }) {
  const key = severity.toLowerCase();
  const cls = SEVERITY_VARIANTS[key] ?? SEVERITY_VARIANTS.info;
  const label =
    severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono font-medium shrink-0 ${cls}`}
    >
      {label}
    </span>
  );
}

/** Classify an error string to drive icon + heading in the error card. */
function classifyErrorType(error: string): {
  icon: React.ReactNode;
  heading: string;
  message: string;
  isRateLimit: boolean;
} {
  const lower = error.toLowerCase();
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("wait")
  ) {
    return {
      icon: <Clock className="w-6 h-6 text-chart-5" aria-hidden="true" />,
      heading: "Rate limit reached",
      message:
        "You've hit Google's free tier request limit (15 requests/min). Wait 1–2 minutes for the quota to reset, then try again.",
      isRateLimit: true,
    };
  }
  if (
    lower.includes("api key") ||
    lower.includes("key is temporarily") ||
    lower.includes("api_key")
  ) {
    return {
      icon: <KeyRound className="w-6 h-6 text-chart-5" aria-hidden="true" />,
      heading: "Service temporarily unavailable",
      message:
        "The AI service is temporarily unavailable. Please try again shortly.",
      isRateLimit: false,
    };
  }
  if (lower.includes("cycles") || lower.includes("processing resources")) {
    return {
      icon: <Zap className="w-6 h-6 text-chart-5" aria-hidden="true" />,
      heading: "Analysis needs more resources",
      message: "The analysis request needs more resources. Please try again.",
      isRateLimit: false,
    };
  }
  if (
    lower.includes("ic0508") ||
    lower.includes("canister") ||
    lower.includes("stopped") ||
    lower.includes("temporarily unavailable")
  ) {
    return {
      icon: (
        <AlertTriangle className="w-6 h-6 text-chart-5" aria-hidden="true" />
      ),
      heading: "Service temporarily offline",
      message:
        "The backend service is temporarily unavailable. Please try again in a moment.",
      isRateLimit: false,
    };
  }
  return {
    icon: <AlertTriangle className="w-6 h-6 text-chart-5" aria-hidden="true" />,
    heading: "Analysis failed",
    message: "Something went wrong with the analysis. Please try again.",
    isRateLimit: false,
  };
}
function SkeletonCard({ index }: { index: number }) {
  // Vary widths to look more natural.
  const widths = ["w-28", "w-32", "w-24", "w-36"];
  return (
    <div
      className="category-card animate-pulse space-y-2"
      aria-hidden="true"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div
        className={`h-4 ${widths[index % widths.length]} bg-muted/50 rounded`}
      />
      <div className="h-3 w-full bg-muted/40 rounded" />
      <div className="h-3 w-3/4 bg-muted/30 rounded" />
    </div>
  );
}

export function ReviewResults({ reviewState, onRetry }: ReviewResultsProps) {
  const { status, data, error } = reviewState;

  /**
   * Accessibility: focus the results container when analysis completes so
   * keyboard/screen-reader users are immediately informed of new content.
   */
  const resultsPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (status === "success" && resultsPanelRef.current) {
      resultsPanelRef.current.focus({ preventScroll: false });
      resultsPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div
        className="flex flex-col gap-3 p-4"
        data-ocid="results-loading"
        aria-label="Analyzing code, please wait…"
        aria-live="polite"
        aria-busy="true"
      >
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    );
  }

  if (status === "error") {
    const { icon, heading, message, isRateLimit } = classifyErrorType(
      error ?? "",
    );
    return (
      <div
        className="flex flex-col items-center justify-center gap-5 h-full min-h-[280px] px-6 py-10"
        data-ocid="results-error"
        role="alert"
        aria-live="assertive"
      >
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-xl border ${isRateLimit ? "bg-chart-5/10 border-chart-5/30" : "bg-muted/40 border-border"}`}
        >
          {icon}
        </div>
        <div className="text-center space-y-2 max-w-[300px]">
          <p
            className={`font-display font-semibold text-sm ${isRateLimit ? "text-chart-5" : "text-foreground"}`}
          >
            {heading}
          </p>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {message}
          </p>
          {isRateLimit && (
            <p className="text-[10px] text-chart-5/70 font-mono bg-chart-5/10 border border-chart-5/20 rounded px-2 py-1 mt-1">
              Google free tier: 15 requests / minute
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/60 font-body pt-1">
            Click &ldquo;Try again&rdquo; to retry your last analysis.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onRetry}
          className={`gap-2 ${isRateLimit ? "border-chart-5/40 text-chart-5 bg-chart-5/10 hover:bg-chart-5/20" : ""}`}
          variant={isRateLimit ? "outline" : "default"}
          data-ocid="retry-btn"
          aria-label="Try again — retry the last analysis"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  if (status === "idle" || !data) {
    return <EmptyState />;
  }

  /**
   * Convert qualityScore from bigint to number HERE — at the render boundary.
   * All downstream components (QualityScore) receive a plain number.
   * This is the single authoritative conversion point; do not do it elsewhere.
   */
  const score = Number(data.qualityScore);

  return (
    <div
      ref={resultsPanelRef}
      className="flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-right-4 duration-500 outline-none"
      data-ocid="results-panel"
      // tabIndex=-1 allows programmatic focus without appearing in tab order.
      tabIndex={-1}
    >
      {/* ── Bugs ── */}
      <CategoryCard
        title="Bugs Found"
        icon={<Bug className="w-4 h-4 text-destructive" aria-hidden="true" />}
        badge={
          <span className="text-[10px] font-mono bg-destructive/15 text-destructive border border-destructive/25 px-1.5 py-0.5 rounded">
            {data.bugs.length}
          </span>
        }
        copyText={
          data.bugs.length > 0
            ? data.bugs.map((b) => `[${b.severity}] ${b.message}`).join("\n")
            : undefined
        }
        data-ocid="card-bugs"
      >
        {data.bugs.length === 0 ? (
          <p className="text-xs text-chart-4 font-body">
            ✓ No bugs detected. Code looks clean!
          </p>
        ) : (
          <ul className="flex flex-col gap-2" aria-label="Detected bugs">
            {data.bugs.map((bug, i) => (
              // Use index+severity+message fragment as key to avoid collisions
              // when two bugs share the same severity.
              <li
                key={`bug-${i}-${bug.severity}`}
                className="flex items-start gap-2"
              >
                <SeverityBadge severity={bug.severity} />
                <span className="text-xs text-muted-foreground font-body leading-relaxed min-w-0 break-words">
                  {bug.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CategoryCard>

      {/* ── Improvements ── */}
      <CategoryCard
        title="Improvements"
        icon={<Lightbulb className="w-4 h-4 text-chart-5" aria-hidden="true" />}
        badge={
          <span className="text-[10px] font-mono bg-chart-5/15 text-chart-5 border border-chart-5/25 px-1.5 py-0.5 rounded">
            {data.improvements.length}
          </span>
        }
        copyText={
          data.improvements.length > 0
            ? data.improvements.join("\n")
            : undefined
        }
        data-ocid="card-improvements"
      >
        {data.improvements.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">
            No improvements suggested.
          </p>
        ) : (
          <ul
            className="flex flex-col gap-1.5"
            aria-label="Improvement suggestions"
          >
            {data.improvements.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-muted-foreground font-body leading-relaxed"
              >
                <span
                  className="text-chart-5 mt-0.5 shrink-0"
                  aria-hidden="true"
                >
                  ›
                </span>
                <span className="break-words min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CategoryCard>

      {/* ── Code Explanation ── */}
      <CategoryCard
        title="Code Explanation"
        icon={<BookOpen className="w-4 h-4 text-accent" aria-hidden="true" />}
        copyText={data.explanation || undefined}
        data-ocid="card-explanation"
      >
        <p className="text-xs text-muted-foreground font-body leading-relaxed whitespace-pre-line break-words">
          {data.explanation || "No explanation provided."}
        </p>
      </CategoryCard>

      {/* ── Best Practices ── */}
      <CategoryCard
        title="Best Practices"
        icon={<Shield className="w-4 h-4 text-chart-4" aria-hidden="true" />}
        badge={
          <span className="text-[10px] font-mono bg-chart-4/15 text-chart-4 border border-chart-4/25 px-1.5 py-0.5 rounded">
            {data.bestPractices.length}
          </span>
        }
        copyText={
          data.bestPractices.length > 0
            ? data.bestPractices.join("\n")
            : undefined
        }
        data-ocid="card-best-practices"
      >
        {data.bestPractices.length === 0 ? (
          <p className="text-xs text-muted-foreground font-body">
            No best practice notes.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5" aria-label="Best practices">
            {data.bestPractices.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-xs text-muted-foreground font-body leading-relaxed"
              >
                <span
                  className="text-chart-4 mt-0.5 shrink-0"
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="break-words min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </CategoryCard>

      {/* ── Quality Score ── */}
      <CategoryCard
        title="Quality Score"
        icon={<Star className="w-4 h-4 text-chart-5" aria-hidden="true" />}
        defaultOpen={true}
        data-ocid="card-quality-score"
      >
        <QualityScore score={score} />
      </CategoryCard>
    </div>
  );
}
