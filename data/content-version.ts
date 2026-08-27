export const CONTENT_VERSION = 3

/** Temporary curriculum-v2 ids mapped onto their surviving canonical vocabulary ids. */
export const legacyProgressVocabularyMap:Record<string,string>={
  v189:'v120', // razumeti
  v214:'v115', // mleko
  v215:'v105', // račun
  v216:'v113', // brez
  v217:'v116', // z
}

export function migrateVocabularyId(id:string){return legacyProgressVocabularyMap[id]||id}

export function migrateContentKey(key:string){
  if(!key.startsWith('vocab:'))return key
  return `vocab:${migrateVocabularyId(key.slice('vocab:'.length))}`
}
