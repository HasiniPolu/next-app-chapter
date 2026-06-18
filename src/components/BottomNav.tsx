import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BarChart3, TrendingUp, Newspaper, User } from "lucide-react";

const ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span>{label}</span>
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