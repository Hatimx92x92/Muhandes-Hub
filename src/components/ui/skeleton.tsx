import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-shimmer rounded-lg",
        className,
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--muted) 0%, var(--border) 40%, var(--muted) 80%)",
        backgroundSize: "200% 100%",
      }}
      {...props}
    />
  )
}

export { Skeleton }
