import * as React from "react";

import { cn } from "@/shared/lib/utils";

type CardProps = React.ComponentProps<"div"> & {
  as?: React.ElementType;
};

function Card({ as: Comp = "div", className, ...props }: CardProps) {
  return (
    <Comp
      data-slot="card"
      className={cn(
        "rounded-2xl border border-border/70 bg-card/92 text-card-foreground shadow-[0_28px_80px_-64px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.72)] dark:bg-card/88 dark:shadow-[0_28px_90px_-66px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex items-center justify-between gap-4 p-5 pb-4", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("text-[15px] font-semibold leading-none tracking-[-0.01em]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("p-5 pt-0", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
