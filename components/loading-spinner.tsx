import { Loader2 } from "lucide-react"

export function LoadingSpinner({
  size = "default",
  className = "",
}: { size?: "sm" | "default" | "lg"; className?: string }) {
  const sizeClass = {
    sm: "h-4 w-4",
    default: "h-8 w-8",
    lg: "h-12 w-12",
  }[size]

  return <Loader2 className={`animate-spin ${sizeClass} ${className}`} />
}

