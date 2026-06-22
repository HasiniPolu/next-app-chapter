import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, TrendingUp, Bell, User } from "lucide-react";

const ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`group relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-wide transition-colors ${
                  active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                )}
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px]">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({
  children,
  hideNav,
}: {
  children: React.ReactNode;
  hideNav?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="mx-auto max-w-md">{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}