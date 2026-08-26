import assert from 'node:assert/strict'
import fs from 'node:fs'

const css = fs.readFileSync('app/globals.css', 'utf8')
const exerciseDeck = fs.readFileSync('components/ExerciseDeck.tsx', 'utf8')
const focusPortal = fs.readFileSync('components/LearningFocusPortal.tsx', 'utf8')

assert.match(css, /:focus-visible\s*\{/, 'Keyboard focus must remain visibly discoverable')
assert.match(css, /prefers-reduced-motion:\s*reduce/, 'Reduced-motion preference must be respected')
assert.match(css, /touch-action:\s*manipulation/, 'Touch controls should avoid delayed gesture handling')
assert.match(css, /body[^}]*overflow-y:\s*auto/, 'Normal app pages and measurable focus overflow must remain scroll-capable')
assert.doesNotMatch(css, /html\[data-learning-focus='true'\][\s\S]{0,180}overflow:\s*hidden/, 'Focus mode must not fake zero-scroll with a document scroll lock')
assert.match(css, /body\s*>\s*main\s*\{\s*display:\s*none/, 'The ordinary app shell must be removed from layout in focus mode')
assert.match(css, /\.learning-focus-root\s*\{[\s\S]*min-height:\s*var\(--learning-viewport-height/, 'Focus mode must size itself from the actually visible viewport')
assert.doesNotMatch(css, /\.exercise-content\s*\{[^}]*overflow:\s*hidden/, 'Exercise content must never be silently clipped to manufacture a passing viewport')
assert.doesNotMatch(css, /\.exercise-feedback-answer\s*\{[^}]*overflow:\s*hidden/, 'Correct answers must never be clipped')
assert.match(exerciseDeck, /!checked\?/, 'Feedback must replace the task instead of being appended below it')
assert.match(exerciseDeck, /showExplanation/, 'Long explanations must live in a separate overlay state')
assert.match(exerciseDeck, /role="progressbar"/, 'Exercise progress must expose semantic progress information')
assert.match(exerciseDeck, /aria-live="polite"/, 'Exercise feedback must be announced without interrupting users')
assert.match(exerciseDeck, /focus\(\{\s*preventScroll:\s*true\s*\}\)/, 'Exercise input focus must not cause layout jumps')
assert.match(exerciseDeck, /Zurücksetzen/, 'Word-bank exercises need an explicit low-friction reset action')
assert.match(focusPortal, /createPortal/, 'Learning focus mode must be independent from surrounding page layout')
assert.match(focusPortal, /visualViewport/, 'Focus mode must react to the iPhone visual viewport and software keyboard')
assert.match(focusPortal, /--learning-viewport-height/, 'Visual viewport height must be exposed to CSS')

console.log('UI/UX focus-mode checks passed')
