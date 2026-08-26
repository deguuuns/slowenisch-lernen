import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('app/globals.css', 'utf8')
const exerciseDeck = fs.readFileSync('components/ExerciseDeck.tsx', 'utf8')

const cssRule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

assert.match(css, /:focus-visible\s*\{/, 'Keyboard focus must remain visibly discoverable')
assert.match(css, /prefers-reduced-motion:\s*reduce/, 'Reduced-motion preference must be respected')
assert.match(css, /touch-action:\s*manipulation/, 'Touch controls should avoid delayed gesture handling')
assert.match(css, /overflow-y:\s*auto/, 'The document must keep normal vertical scrolling available')
assert.doesNotMatch(cssRule('.daily-training-screen'), /position:\s*fixed/, 'Daily training must not be locked into a fixed viewport')
assert.doesNotMatch(cssRule('.exercise-content'), /overflow-y:\s*auto/, 'Exercises should use normal document flow instead of nested vertical scrolling')
assert.doesNotMatch(cssRule('.daily-training-content'), /overflow:\s*hidden/, 'Daily training content must never be clipped')
assert.match(exerciseDeck, /role="progressbar"/, 'Exercise progress must expose semantic progress information')
assert.match(exerciseDeck, /aria-live="polite"/, 'Exercise feedback must be announced without interrupting users')
assert.match(exerciseDeck, /focus\(\{\s*preventScroll:\s*true\s*\}\)/, 'Exercise input focus must not cause layout jumps')
assert.match(exerciseDeck, /Zurücksetzen/, 'Word-bank exercises need an explicit low-friction reset action')

console.log('UI/UX polish checks passed')
