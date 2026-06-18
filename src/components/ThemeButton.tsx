import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const next = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(next)}
      className="rounded-full p-2 hover:bg-accent"
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}