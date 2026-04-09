import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@tanstack/react-router";
import { Code2, Presentation } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className="sticky top-0 z-50 bg-card border-b border-border shadow-xs"
        data-ocid="app-header"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 h-14">
          {/* Logo + Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-accent/15 border border-accent/30 shrink-0">
              <Code2 className="w-4 h-4 text-accent" aria-hidden="true" />
            </div>
            <h1 className="font-display font-semibold text-base tracking-tight text-foreground truncate">
              <span className="text-accent">AI</span>
              <span className="text-muted-foreground">Code</span>
              <span className="text-foreground">Review</span>
            </h1>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-body">
              <span className="w-1.5 h-1.5 rounded-full bg-chart-4 animate-pulse" />
              AI-powered analysis
            </span>
            <Link
              to="/presentation"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-smooth font-body"
              data-ocid="header-presentation-link"
              aria-label="View presentation"
            >
              <Presentation className="w-3.5 h-3.5" />
              Presentation
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col" data-ocid="app-main">
        {children}
      </main>

      <footer className="border-t border-border bg-card py-3 px-4 sm:px-6">
        <p className="text-xs text-muted-foreground text-center font-body">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.hostname : "",
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline transition-smooth"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
