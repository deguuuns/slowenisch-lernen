import assert from 'node:assert/strict'
import { exercises, vocabulary } from '../data/seed'
import { curriculumMetadataIssues, enrichExercises } from '../lib/curriculum-metadata'
import { validateExerciseSet } from '../lib/exercise-integrity'

const enriched = enrichExercises(exercises)
const integrity = validateExerciseSet(enriched, vocabulary)
const metadata = curriculumMetadataIssues(exercises)

assert.deepEqual(
  integrity,
  [],
  `Curriculum integrity issues: ${JSON.stringify(integrity, null, 2)}`,
)
assert.deepEqual(
  metadata,
  [],
  `Curriculum metadata issues: ${JSON.stringify(metadata, null, 2)}`,
)

const exerciseIds = new Set<string>()
for (const exercise of enriched) {
  assert.ok(!exerciseIds.has(exercise.id), `Duplicate exercise id: ${exercise.id}`)
  exerciseIds.add(exercise.id)
  for (const vocabularyId of exercise.vocabularyIds || []) {
    const word = vocabulary.find(item => item.id === vocabularyId)
    assert.ok(word, `${exercise.id} references unknown vocabulary ${vocabularyId}`)
    assert.ok(
      !word || word.lesson <= exercise.lesson,
      `${exercise.id} in lesson ${exercise.lesson} uses future vocabulary ${vocabularyId} from lesson ${word?.lesson}`,
    )
  }
}

// Known legacy placement: this sentence requires lesson-3 transport vocabulary and must no longer
// participate in lesson 1 even though the raw historical seed entry predates curriculum metadata.
assert.equal(enriched.find(exercise => exercise.id === 'e03')?.lesson, 3)

const byLesson = new Map<number, number>()
for (const exercise of enriched) {
  byLesson.set(exercise.lesson, (byLesson.get(exercise.lesson) || 0) + 1)
}

console.log(
  `Curriculum audit passed: ${enriched.length} curated exercises, ${vocabulary.length} vocabulary items, ` +
  `lessons ${Array.from(byLesson.entries()).map(([lesson, count]) => `${lesson}:${count}`).join(', ')}`,
)
