'use client'

import { useEffect } from 'react'
import { initErrorTracking } from '@/lib/error-tracking'

export default function ErrorTrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initErrorTracking()
  }, [])

  return <>{children}</>
}
