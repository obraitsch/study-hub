"use client"

import type { ReactNode } from "react"

interface UniversityVerificationProps {
  universityName: string | undefined
  children: ReactNode
}

export function UniversityVerification({ universityName, children }: UniversityVerificationProps) {
  // In a real app, you might want to verify the user's university email domain
  // or check if they have completed verification steps

  // For now, we'll just render the children if a university name is provided
  if (!universityName) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">You need to be associated with a university to view this content.</p>
      </div>
    )
  }

  return <>{children}</>
}

