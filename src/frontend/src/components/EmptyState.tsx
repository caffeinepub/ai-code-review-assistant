import { ArrowRight, Code2, Cpu } from "lucide-react";

export function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full min-h-[320px] gap-6 px-6 py-10"
      data-ocid="empty-state"
    >
      {/* Icon cluster */}
      <div className="relative flex items-center justify-center w-20 h-20">
        <div className="absolute inset-0 rounded-2xl bg-accent/10 border border-accent/20" />
        <Cpu className="w-9 h-9 text-accent" />
      </div>

      {/* Headline */}
      <div className="text-center space-y-2 max-w-xs">
        <h2 className="font-display font-semibold text-lg text-foreground">
          Ready to analyze your code
        </h2>
        <p className="text-sm text-muted-foreground font-body leading-relaxed">
          Paste your code in the editor, choose a language, then run the
          analysis.
        </p>
      </div>

      {/* Steps */}
      <ol className="flex flex-col gap-2 w-full max-w-[220px]">
        {[
          { step: "1", label: "Paste your code" },
          { step: "2", label: "Select language" },
          { step: "3", label: "Click Analyze" },
        ].map(({ step, label }, i) => (
          <li key={step} className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 border border-accent/30 text-accent font-display text-xs font-semibold shrink-0">
              {step}
            </span>
            <span className="text-sm text-muted-foreground font-body">
              {label}
            </span>
            {i < 2 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground/40 ml-auto shrink-0" />
            )}
          </li>
        ))}
      </ol>

      {/* Tip */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 font-mono bg-muted/30 border border-border px-3 py-1.5 rounded-md">
        <Code2 className="w-3 h-3 shrink-0" />
        <span>Tip: Use Ctrl+Enter to analyze</span>
      </div>
    </div>
  );
}
