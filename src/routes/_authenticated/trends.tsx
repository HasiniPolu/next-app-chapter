import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/BottomNav";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/trends")({
  component: () => (
    <AppShell>
      <ComingSoon title="Trends & Forecasts" desc="Correlation heatmaps, multi-commodity overlays and AI trend signals are coming soon." />
    </AppShell>
  ),
});

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <TrendingUp className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">{desc}</p>
      <span className="mt-4 rounded-full bg-warning/15 px-3 py-1 text-xs font-medium text-warning">Coming soon</span>
    </div>
  );
}