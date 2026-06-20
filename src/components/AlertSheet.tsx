import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { createAlert, updateAlert } from "@/lib/alerts.functions";
import type { Asset, AssetKind } from "@/lib/assets";
import { ALL_ASSETS } from "@/lib/assets";
import { getAllPrices } from "@/lib/prices.functions";
import { Button } from "@/components/ui/button";

type Condition = "above" | "below" | "pct_change";

type EditingAlert = {
  id: string;
  asset_id: string;
  condition: Condition;
  threshold: number;
};

export function AlertSheet({
  asset,
  currentPrice,
  editing,
  onClose,
}: {
  asset?: Asset;
  currentPrice?: number;
  editing?: EditingAlert;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const initialAsset = asset ?? (editing ? ALL_ASSETS.find((a) => a.id === editing.asset_id) : undefined);
  const [picked, setPicked] = useState<Asset | undefined>(initialAsset);
  const [condition, setCondition] = useState<Condition>(editing?.condition ?? "above");
  const [threshold, setThreshold] = useState<string>(
    editing ? String(editing.threshold) : currentPrice ? currentPrice.toFixed(2) : "",
  );

  // Pull live prices so picker shows current value and prefills threshold.
  const pricesQ = useQuery({
    queryKey: ["prices"],
    queryFn: () => getAllPrices(),
    staleTime: 5_000,
  });
  const priceById = useMemo(() => {
    const m = new Map<string, number>();
    pricesQ.data?.snapshots.forEach((s) => m.set(s.commodity_id, s.price));
    return m;
  }, [pricesQ.data]);

  const livePrice = picked ? priceById.get(picked.id) ?? currentPrice ?? 0 : 0;

  const createMut = useMutation({
    mutationFn: () =>
      createAlert({
        data: {
          asset_id: picked!.id,
          asset_kind: picked!.kind,
          condition,
          threshold: Number(threshold),
          currency: "USD",
        },
      }),
    onSuccess: () => {
      toast.success("Alert created");
      qc.invalidateQueries({ queryKey: ["alerts"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: () =>
      updateAlert({
        data: { id: editing!.id, condition, threshold: Number(threshold) },
      }),
    onSuccess: () => {
      toast.success("Alert updated");
      qc.invalidateQueries({ queryKey: ["alerts"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const num = Number(threshold);
  const invalid = !Number.isFinite(num) || num <= 0;
  const isEditing = !!editing;
  const mut = isEditing ? updateMut : createMut;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-auto max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {isEditing ? "Edit alert" : "New alert"}
            </div>
            <div className="text-lg font-bold">{picked ? picked.name : "Choose an asset"}</div>
            {picked && (
              <div className="text-xs text-muted-foreground">
                Currently ${livePrice.toFixed(2)} / {picked.unit}
              </div>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!picked && !isEditing && (
          <AssetPickerInline
            priceById={priceById}
            onPick={(a) => {
              setPicked(a);
              const p = priceById.get(a.id);
              if (p) setThreshold(p.toFixed(2));
            }}
          />
        )}

        {picked && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Condition</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["above", "below", "pct_change"] as Condition[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium ${
                    condition === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {c === "above" ? "Above" : c === "below" ? "Below" : "% Change"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              {condition === "pct_change" ? "Threshold (%)" : "Price (USD)"}
            </label>
            <input
              type="number"
              inputMode="decimal"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base outline-none focus:border-primary"
            />
          </div>

          {!isEditing && (
            <button
              onClick={() => setPicked(undefined)}
              className="text-xs text-primary underline"
            >
              Change asset
            </button>
          )}

          <Button
            onClick={() => mut.mutate()}
            disabled={invalid || mut.isPending}
            className="w-full"
            size="lg"
          >
            {mut.isPending
              ? isEditing
                ? "Saving…"
                : "Creating…"
              : isEditing
                ? "Save changes"
                : "Create alert"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Free plan: up to 3 active alerts. Upgrade for unlimited.
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

function AssetPickerInline({
  priceById,
  onPick,
}: {
  priceById: Map<string, number>;
  onPick: (a: Asset) => void;
}) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<AssetKind | "all">("all");
  const filtered = ALL_ASSETS.filter((a) => {
    if (kind !== "all" && a.kind !== kind) return false;
    if (!q) return true;
    const s = q.toLowerCase();
    return a.name.toLowerCase().includes(s) || a.symbol.toLowerCase().includes(s);
  });
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search commodities & stocks"
          className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-1.5">
        {(["all", "commodity", "stock"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              kind === k
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {k === "all" ? "All" : k === "commodity" ? "Commodities" : "Stocks"}
          </button>
        ))}
      </div>
      <ul className="max-h-[50dvh] divide-y divide-border overflow-y-auto rounded-xl border border-border">
        {filtered.map((a) => {
          const p = priceById.get(a.id);
          return (
            <li key={a.id}>
              <button
                onClick={() => onPick(a)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent"
              >
                <span className="text-base">{a.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.name}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {a.symbol} · {a.kind}
                  </div>
                </div>
                <div className="num text-sm font-semibold">
                  {p !== undefined ? `$${p.toFixed(2)}` : "—"}
                </div>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="p-6 text-center text-xs text-muted-foreground">No matches</li>
        )}
      </ul>
    </div>
  );
}