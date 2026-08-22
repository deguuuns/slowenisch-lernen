// Compatibility layer: all canonical verb morphology now lives in content-registry.
// Existing imports can stay unchanged while the rest of the app migrates incrementally.
export {
  verbCatalog,
  verbById,
  verbByInfinitive,
  verbFormFor,
} from '@/lib/content-registry'

export type {
  VerbEntry,
  VerbForm,
  VerbPerson,
} from '@/lib/content-registry'

export type { VerbNumber } from '@/types'
