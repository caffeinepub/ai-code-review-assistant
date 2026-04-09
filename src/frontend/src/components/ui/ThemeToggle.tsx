import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
      data-ocid="theme-toggle"
      className="relative h-9 w-9 rounded-md border border-border bg-card hover:bg-muted transition-smooth"
    >
      <Sun
        className="h-4 w-4 transition-smooth rotate-0 scale-100 dark:-rotate-90 dark:scale-0 text-foreground"
        aria-hidden="true"
      />
      <Moon
        className="absolute h-4 w-4 transition-smooth rotate-90 scale-0 dark:rotate-0 dark:scale-100 text-foreground"
        aria-hidden="true"
      />
    </Button>
  );
}
