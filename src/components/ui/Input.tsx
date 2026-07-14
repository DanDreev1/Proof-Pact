import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "min-h-11 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-white/30",
        className,
      )}
      {...props}
    />
  );
}
