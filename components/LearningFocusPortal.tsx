'use client'

import { ReactNode, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

let focusUsers = 0

export default function LearningFocusPortal({ children, enabled = true, label = 'Lernmodus' }: { children: ReactNode; enabled?: boolean; label?: string }) {
  const ready = typeof document !== 'undefined'
  const portalTarget = useMemo(() => ready ? document.body : null, [ready])

  useEffect(() => {
    if (!enabled) return
    focusUsers += 1
    document.documentElement.dataset.learningFocus = 'true'
    return () => {
      focusUsers = Math.max(0, focusUsers - 1)
      if (!focusUsers) delete document.documentElement.dataset.learningFocus
    }
  }, [enabled])

  if (!enabled || !portalTarget) return <>{children}</>

  return createPortal(
    <div className="learning-focus-root" role="region" aria-label={label}>
      <div className="learning-focus-frame">{children}</div>
    </div>,
    portalTarget,
  )
}
