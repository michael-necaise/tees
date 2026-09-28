import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...parts: Array<string | false | null | undefined>) {
  return twMerge(clsx(parts));
}

export function Btn({
  tone = "cream",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "cream" | "gold" | "ink" | "ghost" }) {
  const tones = {
    cream: "bg-cream text-ink",
    gold: "bg-gold text-ink",
    ink: "bg-ink text-cream",
    ghost: "border border-line bg-bg text-cream",
  };
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition active:scale-95 disabled:opacity-40",
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
