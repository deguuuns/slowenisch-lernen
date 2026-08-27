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

    const updateViewport = () => {
      const height = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--learning-viewport-height', `${Math.round(height)}px`)
    }
    updateViewport()
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)
    window.addEventListener('resize', updateViewport)

    return () => {
      focusUsers = Math.max(0, focusUsers - 1)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
      window.removeEventListener('resize', updateViewport)
      if (!focusUsers) {
        delete document.documentElement.dataset.learningFocus
        document.documentElement.style.removeProperty('--learning-viewport-height')
      }
    }
  }, [enabled,mounted])

  if (!enabled || !mounted) return <>{children}</>

  return createPortal(
    <div className="learning-focus-root" role="region" aria-label={label} data-learning-focus-root>
      <div className="learning-focus-frame">{children}</div>
    </div>,
    document.body,
  )
}
