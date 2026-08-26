'use client'

import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

let focusUsers = 0

export default function LearningFocusPortal({ children, enabled = true, label = 'Lernmodus' }: { children: ReactNode; enabled?: boolean; label?: string }) {
  const [mounted,setMounted]=useState(false)

  useEffect(()=>{setMounted(true)},[])
  useEffect(() => {
    if (!enabled || !mounted) return
    focusUsers += 1
    document.documentElement.dataset.learningFocus = 'true'
    return () => {
      focusUsers = Math.max(0, focusUsers - 1)
      if (!focusUsers) delete document.documentElement.dataset.learningFocus
    }
  }, [enabled,mounted])

  if (!enabled || !mounted) return <>{children}</>

  return createPortal(
    <div className="learning-focus-root" role="region" aria-label={label}>
      <div className="learning-focus-frame">{children}</div>
    </div>,
    document.body,
  )
}
