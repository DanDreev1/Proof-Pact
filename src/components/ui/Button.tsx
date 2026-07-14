import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
  asChild?: false;
};

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  asChild: true;
};

const variants = {
  primary: "bg-white text-slate-950 hover:bg-slate-200",
  secondary: "bg-slate-800 text-white hover:bg-slate-700",
  ghost: "bg-transparent text-white hover:bg-white/10",
};

export function Button(props: ButtonProps | ButtonLinkProps) {
  const { className, variant = "primary" } = props;
  const classes = cn(
    "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    className,
  );

  if (props.asChild) {
    const { asChild: _asChild, ...linkProps } = props;
    return <Link {...linkProps} className={classes} />;
  }

  const { asChild: _asChild, ...buttonProps } = props;
  return <button {...buttonProps} className={classes} />;
}
