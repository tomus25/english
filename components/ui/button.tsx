import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "default" | "outline" | "ghost";
};

export function Button({ className = "", variant = "default", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition active:scale-[0.99]";
  const variants: Record<string, string> = {
    default: "bg-black text-white hover:bg-black/90",
    outline: "border border-slate-300 hover:bg-slate-50",
    ghost: "hover:bg-slate-100"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
