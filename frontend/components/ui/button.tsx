import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/85 active:bg-foreground/75",
  secondary:
    "bg-accent text-accent-foreground hover:bg-accent-strong/40 active:bg-accent-strong/55",
  ghost:
    "bg-transparent text-foreground border border-border hover:bg-surface active:bg-border/60",
  danger: "bg-transparent text-red-500 border border-red-200 hover:bg-red-50",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "primary", size = "md", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";
