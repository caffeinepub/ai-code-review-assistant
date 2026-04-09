/**
 * QualityScore — displays the AI quality score as an SVG ring + grade bands.
 *
 * Grade bands (per spec):
 *   0–49  → Poor     (red)
 *   50–69 → Fair     (yellow)
 *   70–84 → Good     (blue/teal)
 *   85–100 → Excellent (green)
 *
 * The score prop must already be a number (bigint→number conversion happens
 * in ReviewResults.tsx at the render boundary).
 */
interface QualityScoreProps {
  /** Score from 0 to 100. Must be a number, not bigint. */
  score: number;
}

/** Maps a score to Tailwind token classes for ring, text, and progress bar. */
function getScoreTheme(score: number): {
  ring: string;
  text: string;
  bar: string;
} {
  if (score >= 85) {
    // Excellent — green
    return {
      ring: "stroke-chart-4",
      text: "text-chart-4",
      bar: "quality-bar-success",
    };
  }
  if (score >= 70) {
    // Good — blue/teal
    return {
      ring: "stroke-accent",
      text: "text-accent",
      bar: "bg-accent",
    };
  }
  if (score >= 50) {
    // Fair — yellow/amber
    return {
      ring: "stroke-chart-5",
      text: "text-chart-5",
      bar: "quality-bar-warning",
    };
  }
  // Poor — red (destructive)
  return {
    ring: "stroke-destructive",
    text: "text-destructive",
    bar: "quality-bar-danger",
  };
}

/** Returns a human-readable grade label for the score. */
function getGradeLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}

/** Grade band definitions used for the visual band row. */
const GRADE_BANDS = [
  {
    label: "Poor",
    range: "0–49",
    color: "bg-destructive/20 border-destructive/30 text-destructive",
    isActive: (s: number) => s < 50,
  },
  {
    label: "Fair",
    range: "50–69",
    color: "bg-chart-5/20 border-chart-5/30 text-chart-5",
    isActive: (s: number) => s >= 50 && s < 70,
  },
  {
    label: "Good",
    range: "70–84",
    color: "bg-accent/20 border-accent/30 text-accent",
    isActive: (s: number) => s >= 70 && s < 85,
  },
  {
    label: "Excellent",
    range: "85–100",
    color: "bg-chart-4/20 border-chart-4/30 text-chart-4",
    isActive: (s: number) => s >= 85,
  },
] as const;

export function QualityScore({ score }: QualityScoreProps) {
  // Clamp score to valid range defensively.
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  const { ring, text, bar } = getScoreTheme(safeScore);
  const gradeLabel = getGradeLabel(safeScore);

  // SVG ring geometry
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (safeScore / 100) * circumference;

  return (
    <div
      className="flex flex-col gap-4"
      data-ocid="quality-score"
      // Accessible text fallback for screen readers — no color-only info.
      aria-label={`Quality score: ${safeScore} out of 100 — ${gradeLabel}`}
    >
      {/* Score ring + number */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {/* SVG ring is decorative; the accessible label is on the wrapper. */}
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            className="-rotate-90"
            aria-hidden="true"
          >
            {/* Background track */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="6"
              className="stroke-muted/40"
            />
            {/* Filled arc */}
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              className={`${ring} transition-all duration-700 ease-out`}
            />
          </svg>
          {/* Numeric score centered in ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`font-display font-bold text-xl leading-none ${text}`}
            >
              {safeScore}
            </span>
            <span className="text-muted-foreground text-[9px] font-mono leading-none mt-0.5">
              /100
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-body text-muted-foreground">
              Overall score
            </span>
            <span className={`text-sm font-display font-semibold ${text}`}>
              {gradeLabel}
            </span>
          </div>

          {/* Progress bar */}
          <div className="quality-indicator">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${bar}`}
              style={{ width: `${safeScore}%` }}
            />
          </div>

          {/* Scale markers matching the 4 band breakpoints */}
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground/50">
            <span>0</span>
            <span>50</span>
            <span>70</span>
            <span>85</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Grade band indicators — 4 bands covering 0-100 with no gaps */}
      <div className="grid grid-cols-4 gap-1.5">
        {GRADE_BANDS.map(({ label: gl, range, color, isActive }) => (
          <div
            key={gl}
            className={`px-1.5 py-1.5 rounded border text-center transition-smooth ${color} ${isActive(safeScore) ? "opacity-100 ring-1 ring-current/30" : "opacity-30"}`}
          >
            <div className="text-[10px] font-display font-semibold leading-none">
              {gl}
            </div>
            <div className="text-[9px] font-mono opacity-70 mt-0.5">
              {range}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
