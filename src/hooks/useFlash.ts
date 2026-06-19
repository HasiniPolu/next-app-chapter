import { useEffect, useRef, useState } from "react";

export function useFlash(value: number, ms = 700): "up" | "down" | null {
  const prev = useRef<number | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current !== null && value !== prev.current) {
      setFlash(value > prev.current ? "up" : "down");
      const t = setTimeout(() => setFlash(null), ms);
      prev.current = value;
      return () => clearTimeout(t);
    }
    prev.current = value;
  }, [value, ms]);

  return flash;
}