/**
 * CategoryCard — collapsible section card with optional copy-to-clipboard.
 *
 * Collapse/expand uses a CSS max-height transition (no JS animation library).
 * Copy uses the Clipboard API with graceful degradation on failure.
 */
import { Check, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { useCallback, useState } from "react";
import type { ReactNode } from "react";

interface CategoryCardProps {
  title: string;
  icon: ReactNode;
  badge?: ReactNode;
  /**
   * Plain-text version of the card content used for copy-to-clipboard.
   * Omit if this card should not expose a copy button.
   */
  copyText?: string;
  /** Whether the card starts expanded. Defaults to true. */
  defaultOpen?: boolean;
  "data-ocid"?: string;
  children: ReactNode;
}

export function CategoryCard({
  title,
  icon,
  badge,
  copyText,
  defaultOpen = true,
  "data-ocid": ocid,
  children,
}: CategoryCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  // "idle" | "success" | "error" — drives the copy button icon.
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
    "idle",
  );

  /**
   * Copy card content to clipboard.
   * Shows a success checkmark for 2 s, or an error icon for 2 s on failure
   * (e.g. clipboard permission denied in insecure contexts).
   */
  const handleCopy = useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState("success");
    } catch {
      // Clipboard API not available or permission denied.
      setCopyState("error");
    } finally {
      setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [copyText]);

  const handleToggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <div className="category-card" data-ocid={ocid}>
      {/* Header row */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
        <span className="font-display font-semibold text-sm text-foreground flex-1 truncate">
          {title}
        </span>
        {badge && <span className="shrink-0">{badge}</span>}

        {copyText && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={
              copyState === "success"
                ? "Copied!"
                : copyState === "error"
                  ? "Copy failed — clipboard unavailable"
                  : `Copy ${title} to clipboard`
            }
            title={
              copyState === "success"
                ? "Copied!"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy"
            }
            className="shrink-0 p-1 rounded text-muted-foreground hover:text-accent transition-smooth focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            data-ocid={`${ocid}-copy`}
          >
            {copyState === "success" ? (
              <Check className="w-3.5 h-3.5 text-chart-4" aria-hidden="true" />
            ) : copyState === "error" ? (
              // Show a subtle red X on failure instead of silently failing.
              <Copy
                className="w-3.5 h-3.5 text-destructive"
                aria-hidden="true"
              />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleToggle}
          aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={open}
          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          data-ocid={`${ocid}-toggle`}
        >
          {open ? (
            <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/*
       * Collapsible body — CSS-only max-height transition.
       * max-h-[9999px] is large enough for any realistic card content.
       * No JS is needed to measure or animate the height.
       */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[9999px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
        // Hidden from accessibility tree when collapsed.
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}
