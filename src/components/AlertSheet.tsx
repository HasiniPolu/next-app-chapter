import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createAlert } from "@/lib/alerts.functions";
import type { Asset } from "@/lib/assets";
import { Button } from "@/components/ui/button";

type Condition = "above" | "below" | "pct_change";

export function AlertSheet({
  asset,
  currentPrice,
  onClose,
}: {
  asset: Asset;
  currentPrice: number;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [condition, setCondition] = useState<Condition>("above");
  const [threshold, setThreshold] = useState<string>(currentPrice.toFixed(2));

  const mut = useMutation({
    mutationFn: () =>
      createAlert({
        data: {
          asset_id: asset.id,
          asset_kind: asset.kind,
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

  const num = Number(threshold);
  const invalid = !Number.isFinite(num) || num <= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">New alert</div>
            <div className="text-lg font-bold">{asset.name}</div>
            <div className="text-xs text-muted-foreground">
              Currently ${currentPrice.toFixed(2)} / {asset.unit}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

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

          <Button
            onClick={() => mut.mutate()}
            disabled={invalid || mut.isPending}
            className="w-full"
            size="lg"
          >
            {mut.isPending ? "Creating…" : "Create alert"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            Free plan: up to 3 active alerts. Upgrade for unlimited.
          </p>
        </div>
      </div>
    </div>
  );
}