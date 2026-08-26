import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('app/globals.css', 'utf8')
const exerciseDeck = fs.readFileSync('components/ExerciseDeck.tsx', 'utf8')

assert.match(css, /:focus-visible\s*\{/, 'Keyboard focus must remain visibly discoverable')
assert.match(css, /prefers-reduced-motion:\s*reduce/, 'Reduced-motion preference must be respected')
assert.match(css, /touch-action:\s*manipulation/, 'Touch controls should avoid delayed gesture handling')
assert.match(css, /max-height:\s*700px/, 'Short mobile viewports need a dedicated compact exercise layout')
assert.match(exerciseDeck, /role="progressbar"/, 'Exercise progress must expose semantic progress information')
assert.match(exerciseDeck, /aria-live="polite"/, 'Exercise feedback must be announced without interrupting users')
assert.match(exerciseDeck, /focus\(\{ preventScroll: true \}\)/, 'Exercise input focus must not cause layout jumps')
assert.match(exerciseDeck, /Zurücksetzen/, 'Word-bank exercises need an explicit low-friction reset action')

console.log('UI/UX polish checks passed')
