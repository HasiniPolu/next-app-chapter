import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/BottomNav";
import { ALL_ASSETS } from "@/lib/assets";
import {
  deleteAlert,
  evaluateMyAlerts,
  listAlerts,
  rearmAlert,
  toggleAlert,
} from "@/lib/alerts.functions";
import {
  Bell,
  BellOff,
  Trash2,
  ArrowUp,
  ArrowDown,
  Percent,
  CheckCircle2,
  Plus,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Currency } from "@/lib/commodities";
import { getProfile } from "@/lib/profile.functions";
import { AlertSheet } from "@/components/AlertSheet";

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

type EditState = {
  id: string;
  asset_id: string;
  condition: "above" | "below" | "pct_change";
  threshold: number;
};

function Inner() {
  const qc = useQueryClient();
  const alerts = useSuspenseQuery({ queryKey: ["alerts"], queryFn: () => listAlerts() });
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const currency = (profile.data?.currency ?? "USD") as Currency;
  const plan = profile.data?.plan ?? "free";

  const [sheet, setSheet] = useState<null | { mode: "new" } | { mode: "edit"; editing: EditState }>(
    null,
  );
  const lastTriggeredCount = useRef<number>(alerts.data.filter((a) => a.triggered_at).length);

  // Evaluate the user's alerts every 15s while on this page so triggers fire
  // without external cron infrastructure.
  const evalQ = useQuery({
    queryKey: ["alerts-eval"],
    queryFn: () => evaluateMyAlerts(),
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  useEffect(() => {
    if (evalQ.data?.triggered) {
      qc.invalidateQueries({ queryKey: ["alerts"] });
    }
  }, [evalQ.data?.triggered, qc]);

  useEffect(() => {
    const triggered = alerts.data.filter((a) => a.triggered_at).length;
    if (triggered > lastTriggeredCount.current) {
      const delta = triggered - lastTriggeredCount.current;
      toast.success(`${delta} alert${delta > 1 ? "s" : ""} triggered`);
    }
    lastTriggeredCount.current = triggered;
  }, [alerts.data]);

  const toggle = useMutation({
    mutationFn: (v: { id: string; active: boolean }) => toggleAlert({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAlert({ data: { id } }),
    onSuccess: () => {
      toast.success("Alert deleted");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
  const rearm = useMutation({
    mutationFn: (id: string) => rearmAlert({ data: { id } }),
    onSuccess: () => {
      toast.success("Alert re-armed");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });

  const active = alerts.data.filter((a) => a.active && !a.triggered_at);
  const triggered = alerts.data.filter((a) => a.triggered_at);
  const paused = alerts.data.filter((a) => !a.active && !a.triggered_at);
  const atFreeCap = plan !== "premium" && active.length >= 3;

  return (
    <div className="space-y-5 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold">Price Alerts</h1>
          <p className="text-xs text-muted-foreground">
            {active.length} active · {triggered.length} triggered
          </p>
        </div>
        <button
          onClick={() => setSheet({ mode: "new" })}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          New alert
        </button>
      </header>

      {atFreeCap && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
          You've reached the free plan limit (3/3 active alerts).{" "}
          <Link to="/pricing" className="font-semibold text-primary underline">
            Upgrade to Premium
          </Link>{" "}
          for unlimited.
        </div>
      )}

      {alerts.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <Bell className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">No alerts yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Track price moves on commodities or stocks the moment they happen.
          </p>
          <button
            onClick={() => setSheet({ mode: "new" })}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Create your first alert
          </button>
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
              onEdit={() =>
                setSheet({
                  mode: "edit",
                  editing: {
                    id: a.id,
                    asset_id: a.asset_id,
                    condition: a.condition as EditState["condition"],
                    threshold: Number(a.threshold),
                  },
                })
              }
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
              onRearm={() => rearm.mutate(a.id)}
              onEdit={() =>
                setSheet({
                  mode: "edit",
                  editing: {
                    id: a.id,
                    asset_id: a.asset_id,
                    condition: a.condition as EditState["condition"],
                    threshold: Number(a.threshold),
                  },
                })
              }
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
              onEdit={() =>
                setSheet({
                  mode: "edit",
                  editing: {
                    id: a.id,
                    asset_id: a.asset_id,
                    condition: a.condition as EditState["condition"],
                    threshold: Number(a.threshold),
                  },
                })
              }
            />
          ))}
        </Section>
      )}

      {sheet?.mode === "new" && <AlertSheet onClose={() => setSheet(null)} />}
      {sheet?.mode === "edit" && (
        <AlertSheet editing={sheet.editing} onClose={() => setSheet(null)} />
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
  onEdit,
  onRearm,
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
  onEdit?: () => void;
  onRearm?: () => void;
}) {
  const asset = ALL_ASSETS.find((x) => x.id === alert.asset_id);
  if (!asset) return null;
  const Icon = alert.condition === "above" ? ArrowUp : alert.condition === "below" ? ArrowDown : Percent;
  const condLabel =
    alert.condition === "pct_change"
      ? `Δ ${alert.threshold}%`
      : `${alert.condition === "above" ? "≥" : "≤"} ${formatPrice(Number(alert.threshold), currency)}`;

  return (
    <li className="flex items-center gap-1 rounded-2xl border border-border bg-card p-3">
      <Link to="/commodity/$id" params={{ id: asset.id }} className="flex min-w-0 flex-1 items-center gap-3">
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
      {triggered && onRearm && (
        <button
          onClick={onRearm}
          aria-label="Re-arm"
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-primary"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={onEdit}
          aria-label="Edit"
          className="rounded-full p-2 text-muted-foreground hover:bg-accent hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
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