import { UserProgress, VocabularyStatus } from '@/types'

export const MASTERY_THRESHOLDS={weak:.45,learning:.65,known:.8,mastered:.9}

export function getVocabularyStatus(wordId:string,progress:UserProgress):VocabularyStatus{
 if(!progress.introducedWords.includes(wordId))return 'neu'
 const mastery=progress.mastery?.[`vocab:${wordId}`]
 if(!mastery||mastery.attempts===0)return 'eingeführt'
 const activeCorrect=mastery.activeCorrect||0
 const review=progress.reviews.find(r=>r.key===`vocab:${wordId}`||r.key===wordId)
 if(mastery.score>=MASTERY_THRESHOLDS.mastered&&activeCorrect>=2&&(review?.intervalIndex||0)>=3)return 'sicher'
 if(mastery.score>=MASTERY_THRESHOLDS.known&&mastery.correct>=3&&activeCorrect>=1)return 'gelernt'
 return 'lernen'
}

export function reconcileVocabularyProgress(progress:UserProgress,wordIds:string[]):UserProgress{
 const learned=new Set(progress.wordsLearned),secure=new Set(progress.secureWords)
 for(const id of wordIds){const status=getVocabularyStatus(id,progress);if(status==='gelernt'||status==='sicher')learned.add(id);else learned.delete(id);if(status==='sicher')secure.add(id);else secure.delete(id)}
 return {...progress,wordsLearned:Array.from(learned),secureWords:Array.from(secure)}
}
