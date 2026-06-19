import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/BottomNav";
import { ALL_ASSETS } from "@/lib/assets";
import { deleteAlert, listAlerts, toggleAlert } from "@/lib/alerts.functions";
import { Bell, BellOff, Trash2, ArrowUp, ArrowDown, Percent, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Currency } from "@/lib/commodities";
import { getProfile } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </AppShell>
  );
}

function Inner() {
  const qc = useQueryClient();
  const alerts = useSuspenseQuery({ queryKey: ["alerts"], queryFn: () => listAlerts() });
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const currency = (profile.data?.currency ?? "USD") as Currency;

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleAlert({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAlert({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const active = alerts.data.filter((a) => a.active && !a.triggered_at);
  const triggered = alerts.data.filter((a) => a.triggered_at);
  const paused = alerts.data.filter((a) => !a.active && !a.triggered_at);

  return (
    <div className="space-y-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Price Alerts</h1>
          <p className="text-xs text-muted-foreground">
            {active.length} active · {triggered.length} triggered
          </p>
        </div>
        <Bell className="h-5 w-5 text-primary" />
      </header>

      {alerts.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No alerts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open any asset and tap the bell icon to create your first alert.
          </p>
          <Link
            to="/dashboard"
            className="mt-3 inline-block rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Browse assets
          </Link>
        </div>
      )}

      {active.length > 0 && (
        <Section title="Active">
          {active.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              currency={currency}
              onToggle={(active) => toggle.mutate({ id: a.id, active })}
              onDelete={() => del.mutate(a.id)}
            />
          ))}
        </Section>
      )}

      {triggered.length > 0 && (
        <Section title="Triggered">
          {triggered.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              currency={currency}
              triggered
              onToggle={(active) => toggle.mutate({ id: a.id, active })}
              onDelete={() => del.mutate(a.id)}
            />
          ))}
        </Section>
      )}

      {paused.length > 0 && (
        <Section title="Paused">
          {paused.map((a) => (
            <AlertRow
              key={a.id}
              alert={a}
              currency={currency}
              onToggle={(active) => toggle.mutate({ id: a.id, active })}
              onDelete={() => del.mutate(a.id)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function AlertRow({
  alert,
  currency,
  triggered,
  onToggle,
  onDelete,
}: {
  alert: {
    id: string;
    asset_id: string;
    condition: string;
    threshold: number;
    active: boolean;
    triggered_at: string | null;
    triggered_price: number | null;
  };
  currency: Currency;
  triggered?: boolean;
  onToggle: (active: boolean) => void;
  onDelete: () => void;
}) {
  const asset = ALL_ASSETS.find((x) => x.id === alert.asset_id);
  if (!asset) return null;
  const Icon = alert.condition === "above" ? ArrowUp : alert.condition === "below" ? ArrowDown : Percent;
  const condLabel =
    alert.condition === "pct_change"
      ? `Δ ${alert.threshold}%`
      : `${alert.condition === "above" ? "≥" : "≤"} ${formatPrice(Number(alert.threshold), currency)}`;

  return (
    <li className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3">
      <Link to="/commodity/$id" params={{ id: asset.id }} className="flex flex-1 items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{asset.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{asset.symbol}</span>
          </div>
          <div className="text-xs text-muted-foreground">{condLabel}</div>
          {triggered && alert.triggered_at && (
            <div className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-positive">
              <CheckCircle2 className="h-3 w-3" />
              Triggered {new Date(alert.triggered_at).toLocaleString()}
            </div>
          )}
        </div>
      </Link>
      <button
        onClick={() => onToggle(!alert.active)}
        aria-label={alert.active ? "Pause" : "Resume"}
        className="rounded-full p-2 text-muted-foreground hover:bg-accent"
      >
        {alert.active ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4" />}
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete"
        className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-negative"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}