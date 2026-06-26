import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/18 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-secondary/28",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
