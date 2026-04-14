import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md", className)}
      style={{
        background: 'var(--color-surf-2)',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...props.style,
      }}
      {...props}
    />
  )
}

export { Skeleton }
