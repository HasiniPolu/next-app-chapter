import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { AppShell } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCIES, type Currency } from "@/lib/commodities";
import { getProfile, updateProfile } from "@/lib/profile.functions";
import { useTheme } from "@/hooks/useTheme";
import { LogOut, Crown, Star, ChevronRight, Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
        <Inner />
      </Suspense>
    </AppShell>
  );
}

function Inner() {
  const profile = useSuspenseQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const qc = useQueryClient();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const updateName = useMutation({
    mutationFn: (display_name: string) => updateProfile({ data: { display_name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const p = profile.data!;
  const isPremium = p.plan === "premium";

  return (
    <div className="space-y-6 p-4">
      <header className="pt-2 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">
          {p.display_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <h1 className="mt-3 text-xl font-bold">{p.display_name}</h1>
        {isPremium ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
            <Crown className="h-3 w-3" /> Premium
          </span>
        ) : (
          <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Free plan</span>
        )}
      </header>

      <section className="space-y-1">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preferences</h2>
        <div className="rounded-2xl border border-border bg-card">
          <Row label="Display name" value={p.display_name ?? ""} onChange={(v) => updateName.mutate(v)} />
          <Divider />
          <SelectRow
            label="Currency"
            value={(p.currency ?? "USD") as Currency}
            options={CURRENCIES}
            onChange={async (v) => {
              await updateProfile({ data: { currency: v as Currency } });
              qc.invalidateQueries({ queryKey: ["profile"] });
            }}
          />
          <Divider />
          <SelectRow
            label="Theme"
            value={theme}
            options={["light", "dark", "system"]}
            onChange={(v) => setTheme(v as "light" | "dark" | "system")}
          />
        </div>
      </section>

      <section className="space-y-1">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</h2>
        <div className="rounded-2xl border border-border bg-card">
          <NavLink to="/watchlist" icon={Star} label="My watchlist" />
          <Divider />
          <NavLink to="/pricing" icon={Crown} label={isPremium ? "Manage subscription" : "Upgrade to Premium"} />
        </div>
      </section>

      <Button variant="outline" className="w-full" onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
      <p className="text-center text-[10px] text-muted-foreground">SentiMarket v1.0 · Made with <Heart className="inline h-3 w-3 text-negative" /></p>
    </div>
  );
}

function Row({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <input
        defaultValue={value}
        onBlur={(e) => {
          if (e.target.value && e.target.value !== value) onChange(e.target.value);
        }}
        className="w-1/2 rounded-md bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground focus:bg-secondary px-2 py-1"
      />
    </label>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-card px-2 py-1 text-sm capitalize"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function Divider() {
  return <div className="mx-4 border-t border-border" />;
}

function NavLink({ to, icon: Icon, label }: { to: "/watchlist" | "/pricing"; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <Link to={to} className="flex items-center justify-between px-4 py-3 hover:bg-accent">
      <span className="flex items-center gap-3 text-sm font-medium">
        <Icon className="h-4 w-4 text-muted-foreground" /> {label}
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}