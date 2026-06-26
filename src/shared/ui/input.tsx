import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/18 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary/28",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
