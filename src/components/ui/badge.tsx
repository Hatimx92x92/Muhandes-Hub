import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-muted text-muted-foreground",
        outline: "border border-border text-foreground bg-transparent",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
        // Role badges
        project_owner: "bg-role-po text-role-po-foreground",
        contractor: "bg-role-contractor text-role-contractor-foreground",
        supplier: "bg-role-supplier text-role-supplier-foreground",
        buyer: "bg-role-buyer text-role-buyer-foreground",
        // Tier badges
        starter: "bg-tier-starter text-tier-starter-foreground",
        pro: "bg-tier-pro text-tier-pro-foreground",
        business: "bg-tier-business text-tier-business-foreground",
        enterprise: "bg-tier-enterprise text-tier-enterprise-foreground",
        // Status badges
        draft: "bg-status-draft text-status-draft-foreground",
        pending: "bg-status-pending text-status-pending-foreground",
        published: "bg-status-published text-status-published-foreground",
        rejected: "bg-status-rejected text-status-rejected-foreground",
        awarded: "bg-status-awarded text-status-awarded-foreground",
        completed: "bg-status-completed text-status-completed-foreground",
        active: "bg-status-active text-status-active-foreground",
        cancelled: "bg-status-cancelled text-status-cancelled-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
