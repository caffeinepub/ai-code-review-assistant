/**
 * CodeEditor — textarea with synchronized line numbers, language selector,
 * toolbar actions, and keyboard shortcut support.
 *
 * Features:
 *   - Line numbers synchronized with textarea scroll
 *   - Ctrl/Cmd+Enter to submit
 *   - Tab key inserts 2 spaces
 *   - Sample code loader per language
 *   - Code length validation (max 50,000 chars) with user-friendly warning
 *   - Memoized line-number array to avoid recalculating on every render
 */
import { Button } from "@/components/ui/button";
import { getSampleForLanguage } from "@/data/samples";
import type { Language } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/types";
import { ChevronDown, Code2, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

/** Maximum code length before the editor shows a warning and disables submit. */
const MAX_CODE_LENGTH = 50_000;

interface CodeEditorProps {
  code: string;
  language: Language;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: Language) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onSubmit,
  isLoading,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Memoize line numbers — only recalculates when the number of lines changes,
   * not on every character typed within a line.
   */
  const lineCount = useMemo(() => {
    const n = code.split("\n").length;
    return Math.max(n, 1);
  }, [code]);

  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount],
  );

  const isOverLimit = code.length > MAX_CODE_LENGTH;
  const charCount = code.length;

  /** Ctrl/Cmd+Enter → submit; Tab → 2 spaces. */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isLoading && !isOverLimit && code.trim()) onSubmit();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = `${code.substring(0, start)}  ${code.substring(end)}`;
        onCodeChange(next);
        // Restore cursor position after React re-render.
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [isLoading, isOverLimit, code, onCodeChange, onSubmit],
  );

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange],
  );

  const handleClear = useCallback(() => {
    onCodeChange("");
    textareaRef.current?.focus();
  }, [onCodeChange]);

  const handleSample = useCallback(() => {
    const sample = getSampleForLanguage(language);
    // Load language-specific sample or a generic fallback.
    onCodeChange(
      sample ?? `// ${language} sample\nconsole.log("Hello, world!");`,
    );
    textareaRef.current?.focus();
  }, [language, onCodeChange]);

  const handleLanguageChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onLanguageChange(e.target.value as Language);
    },
    [onLanguageChange],
  );

  // Submit is disabled when: no code, currently loading, or code is too long.
  const isSubmitDisabled = !code.trim() || isLoading || isOverLimit;

  return (
    <div className="flex flex-col h-full" data-ocid="code-editor">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
        {/* Language selector with explicit label (screen reader + visible) */}
        <label htmlFor="language-select" className="sr-only">
          Programming language
        </label>
        <div className="relative">
          <select
            id="language-select"
            value={language}
            onChange={handleLanguageChange}
            className="appearance-none pl-3 pr-8 py-1.5 rounded-md border border-input bg-muted/40 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-smooth cursor-pointer"
            data-ocid="language-select"
            aria-label="Select programming language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <div className="flex-1" />

        {/* Sample code button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSample}
          className="gap-1.5 text-xs h-7 px-2.5"
          data-ocid="sample-btn"
          aria-label={`Load ${language} sample code`}
        >
          <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Sample</span>
        </Button>

        {/* Clear button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={!code}
          className="gap-1.5 text-xs h-7 px-2.5 text-muted-foreground hover:text-destructive"
          data-ocid="clear-btn"
          aria-label="Clear editor"
        >
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      </div>

      {/* ── Editor body: line numbers + textarea ── */}
      <div className="flex flex-1 overflow-auto min-h-0 bg-background">
        {/* Line numbers — aria-hidden since they are not interactive content */}
        <div
          className="select-none shrink-0 pt-3 pb-3 text-right bg-card border-r border-border"
          aria-hidden="true"
          style={{
            minWidth: "3rem",
            paddingRight: "0.6rem",
            paddingLeft: "0.4rem",
          }}
        >
          {lineNumbers.map((n) => (
            <div
              key={`ln-${n}`}
              className="font-mono text-xs text-muted-foreground/50 leading-relaxed"
              style={{ lineHeight: "1.625rem" }}
            >
              {n}
            </div>
          ))}
        </div>

        {/* Code textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          placeholder={`// Paste or type your ${language} code here…\n// Press Ctrl+Enter to analyze`}
          className="flex-1 resize-none border-none outline-none bg-transparent code-editor px-4 py-3 w-full placeholder:text-muted-foreground/30 caret-accent"
          style={{ lineHeight: "1.625rem", minHeight: "100%" }}
          data-ocid="code-textarea"
          aria-label="Code input"
          aria-describedby="editor-status"
        />
      </div>

      {/* ── Footer: char count + validation warning + submit ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-card shrink-0 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            id="editor-status"
            className={`text-xs font-mono ${isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground/60"}`}
            data-ocid="char-count"
          >
            {charCount.toLocaleString()} chars · {lineCount} lines
          </span>
          {isOverLimit && (
            <span
              className="text-xs text-destructive font-body"
              role="alert"
              aria-live="polite"
            >
              Code exceeds {MAX_CODE_LENGTH.toLocaleString()} character limit
            </span>
          )}
        </div>

        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className="gap-2 h-8 px-4 text-sm font-display font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth shrink-0"
          data-ocid="analyze-btn"
          aria-label={
            isLoading
              ? "Analysis in progress"
              : isOverLimit
                ? "Code is too long to analyze"
                : "Analyze code (Ctrl+Enter)"
          }
        >
          {isLoading ? (
            <>
              <span
                className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
                aria-hidden="true"
              />
              Analyzing…
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Analyze</span>
              <span className="sm:hidden">Run</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono opacity-60 bg-primary-foreground/10 px-1 rounded">
                ⌘↵
              </kbd>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
