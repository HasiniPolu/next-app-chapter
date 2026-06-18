import { createFileRoute } from "@tanstack/react-router";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles, Star } from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "SentiMarket — Intelligence for Every Market Move" },
      { name: "description", content: "Live commodity prices, AI forecasts and personalized watchlists for gold, silver, oil, petrol, diesel and more." },
      { property: "og:title", content: "SentiMarket" },
      { property: "og:description", content: "Live commodity prices and AI forecasts in your pocket." },
      { name: "theme-color", content: "#1A1F5E" },
    ],
  }),
  component: Onboarding,
});

const SLIDES = [
  {
    icon: TrendingUp,
    title: "Live Prices",
    desc: "Real-time prices for gold, silver, crude oil, petrol, diesel and more — refreshed continuously.",
  },
  {
    icon: Sparkles,
    title: "AI Forecasts",
    desc: "GPT-4o powered price predictions with confidence scores and plain-English rationale.",
  },
  {
    icon: Star,
    title: "Your Watchlist",
    desc: "Track the commodities you care about. Sync across devices, see at a glance.",
  },
];

function Onboarding() {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/home" });
    });
  }, [navigate]);

  const slide = SLIDES[idx];
  const Icon = slide.icon;
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-10">
      <div className="flex justify-end">
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          Skip
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-lg">
          <Icon className="h-10 w-10" strokeWidth={1.8} />
        </div>
        <h1 className="mb-3 text-3xl font-bold tracking-tight">{slide.title}</h1>
        <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{slide.desc}</p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button
          className="h-12 w-full text-base"
          onClick={() => (isLast ? navigate({ to: "/auth" }) : setIdx(idx + 1))}
        >
          {isLast ? "Get Started" : "Next"}
        </Button>
        <Link to="/auth" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          I already have an account
        </Link>
      </div>
    </div>
  );
}
