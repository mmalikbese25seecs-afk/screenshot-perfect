import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        bestseller: "border-transparent bg-secondary text-secondary-foreground",
        new: "border-transparent bg-success text-success-foreground",
        spicy: "border-transparent bg-primary text-primary-foreground",
        vegetarian: "border-transparent bg-success/15 text-success",
        premium: "border-transparent bg-charcoal text-cream",
        soft: "border-transparent bg-primary-soft text-primary",
        gold: "border-transparent bg-secondary/25 text-secondary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
