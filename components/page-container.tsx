import type React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: "default" | "narrow" | "wide" | "full"
}

export function PageContainer({ children, className, maxWidth = "default" }: PageContainerProps) {
  const maxWidthClasses = {
    narrow: "max-w-3xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
    full: "max-w-full",
  }

  return (
    <div className="w-full flex justify-center px-4 sm:px-6">
      <div className={cn("w-full py-10", maxWidthClasses[maxWidth], className)}>{children}</div>
    </div>
  )
}

