import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('app/globals.css', 'utf8')
const exerciseDeck = fs.readFileSync('components/ExerciseDeck.tsx', 'utf8')
const focusPortal = fs.readFileSync('components/LearningFocusPortal.tsx', 'utf8')

assert.match(css, /:focus-visible\s*\{/, 'Keyboard focus must remain visibly discoverable')
assert.match(css, /prefers-reduced-motion:\s*reduce/, 'Reduced-motion preference must be respected')
assert.match(css, /touch-action:\s*manipulation/, 'Touch controls should avoid delayed gesture handling')
assert.match(css, /body[^}]*overflow-y:\s*auto/, 'Normal app pages must remain normally scrollable')
assert.match(css, /html\[data-learning-focus='true'\][\s\S]*overflow:\s*hidden/, 'Only the explicit focus mode may suppress document scrolling')
assert.match(css, /body\s*>\s*main\s*\{\s*display:\s*none/, 'The ordinary app shell must be removed from layout in focus mode')
assert.match(css, /\.learning-focus-root\s*\{[\s\S]*position:\s*fixed[\s\S]*inset:\s*0/, 'Focus mode must own the visible viewport')
assert.match(css, /\.exercise-shell\s*\{[\s\S]*grid-template-rows:\s*auto\s+minmax\(0,1fr\)\s+auto/, 'Exercise layout must reserve fixed structural regions instead of growing vertically')
assert.match(css, /\.exercise-content\s*\{[\s\S]*overflow:\s*hidden/, 'The ordinary exercise state must fit the available center region')
assert.match(exerciseDeck, /!checked\?/, 'Feedback must replace the task instead of being appended below it')
assert.match(exerciseDeck, /showExplanation/, 'Long explanations must live in a separate overlay state')
assert.match(exerciseDeck, /role="progressbar"/, 'Exercise progress must expose semantic progress information')
assert.match(exerciseDeck, /aria-live="polite"/, 'Exercise feedback must be announced without interrupting users')
assert.match(exerciseDeck, /focus\(\{\s*preventScroll:\s*true\s*\}\)/, 'Exercise input focus must not cause layout jumps')
assert.match(exerciseDeck, /Zurücksetzen/, 'Word-bank exercises need an explicit low-friction reset action')
assert.match(focusPortal, /createPortal/, 'Learning focus mode must be independent from surrounding page layout')

console.log('UI/UX focus-mode checks passed')
