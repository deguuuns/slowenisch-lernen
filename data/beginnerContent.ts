import type { Exercise } from '@/types'

const intro = (id: string, order: number, sl: string, de: string, usage: string, phase: number, extra: Partial<Exercise> = {}): Exercise => ({
  id, lesson: 1, type: 'introduce', modality: 'text', prompt: `Neu: ${sl}`, answer: sl,
  introSl: sl, introDe: de, introUsage: usage, audioPrompt: sl, level: 'A1', difficulty: 1,
  skills: ['hören','wortschatz'], introducesVocabulary: [sl.toLocaleLowerCase('sl-SI').replace(/[.!?]$/,'')],
  learningTargets: [`vocab:${sl.toLocaleLowerCase('sl-SI').replace(/[.!?]$/,'')}`], contextTag: 'beginner-foundation',
  contentKey: `intro-${id}`, learningPhase: 'new', curriculumPhase: phase, curriculumOrder: order, maxNewItemsInSession: 5, ...extra,
})

export const beginnerExercises: Exercise[] = [
  // PHASE 1 — five useful words. No production before recognition.
  intro('zivjo',1,'Živjo','Hallo','Eine normale, freundliche Begrüßung.',1),
  intro('hvala',2,'Hvala','Danke','Damit bedankst du dich.',1),
  intro('prosim',3,'Prosim','Bitte / gern','Als „bitte“, höfliche Ergänzung oder Antwort auf Danke.',1),
  intro('ja',4,'Ja','Ja','Kurze positive Antwort.',1),
  intro('ne',5,'Ne','Nein','Kurze negative Antwort.',1),

  { id:'p1-zivjo-rec-de', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „živjo“?', answer:'Hallo', alternatives:['Hallo','Danke','Bitte'], requiredVocabulary:['živjo'], learningTargets:['vocab:živjo'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:6, contentKey:'zivjo-meaning' },
  { id:'p1-hvala-rec-de', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „hvala“?', answer:'Danke', alternatives:['Danke','Nein','Hallo'], requiredVocabulary:['hvala'], learningTargets:['vocab:hvala'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:7, contentKey:'hvala-meaning' },
  { id:'p1-prosim-rec-de', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „prosim“?', answer:'Bitte / gern', alternatives:['Bitte / gern','Guten Morgen','Nein'], requiredVocabulary:['prosim'], learningTargets:['vocab:prosim'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:8, contentKey:'prosim-meaning' },
  { id:'p1-ja-ne-rec', lesson:1, type:'choice', modality:'choice', prompt:'Welches Wort bedeutet „nein“?', answer:'ne', alternatives:['ja','ne','hvala'], requiredVocabulary:['ja','ne'], learningTargets:['vocab:ja','vocab:ne'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:9, contentKey:'ja-ne-recognition' },
  { id:'p1-zivjo-listen', lesson:1, type:'listen-choice', modality:'listening', prompt:'Höre das Wort. Was bedeutet es?', audioPrompt:'Živjo', answer:'Hallo', alternatives:['Hallo','Danke','Nein'], requiredVocabulary:['živjo'], learningTargets:['vocab:živjo'], level:'A1', difficulty:1, skills:['hören','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:10, contentKey:'zivjo-listen' },
  { id:'p1-hvala-listen', lesson:1, type:'listen-choice', modality:'listening', prompt:'Höre das Wort. Was bedeutet es?', audioPrompt:'Hvala', answer:'Danke', alternatives:['Danke','Bitte / gern','Ja'], requiredVocabulary:['hvala'], learningTargets:['vocab:hvala'], level:'A1', difficulty:1, skills:['hören','wortschatz'], learningPhase:'recognition', curriculumPhase:1, curriculumOrder:11, contentKey:'hvala-listen' },
  { id:'p1-prosim-recall-choice', lesson:1, type:'choice', modality:'choice', prompt:'Wie heißt „bitte / gern“ auf Slowenisch?', answer:'prosim', alternatives:['prosim','hvala','živjo'], requiredVocabulary:['prosim'], learningTargets:['vocab:prosim'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recall', curriculumPhase:1, curriculumOrder:12, requiredTargetStage:'recognition', contentKey:'prosim-recall' },
  { id:'p1-hvala-recall', lesson:1, type:'fill', modality:'text', prompt:'Wie heißt „Danke“ auf Slowenisch?', answer:'hvala', requiredVocabulary:['hvala'], learningTargets:['vocab:hvala'], level:'A1', difficulty:2, skills:['schreiben','wortschatz'], learningPhase:'recall', curriculumPhase:1, curriculumOrder:13, requiredTargetStage:'recognition', contentKey:'hvala-active-recall' },
  { id:'p1-dialog', lesson:1, type:'choice', modality:'choice', prompt:'A: Hvala!  B: ___', answer:'Prosim!', alternatives:['Prosim!','Ne!','Živjo!'], acceptedAnswers:['Prosim','prosim'], requiredVocabulary:['hvala','prosim'], learningTargets:['vocab:hvala','vocab:prosim'], level:'A1', difficulty:2, skills:['lesen','wortschatz'], learningPhase:'application', curriculumPhase:1, curriculumOrder:14, requiredTargetStage:'recall', contentKey:'dialog-hvala-prosim' },

  // PHASE 2 — greeting chunks are learned as complete units.
  intro('dobro-jutro',20,'Dobro jutro','Guten Morgen','Begrüßung am Morgen.',2,{ introducesVocabulary:['dobro jutro'], learningTargets:['vocab:dobro jutro'] }),
  intro('dober-dan',21,'Dober dan','Guten Tag','Normale Begrüßung tagsüber.',2,{ introducesVocabulary:['dober dan'], learningTargets:['vocab:dober dan'] }),
  intro('dober-vecer',22,'Dober večer','Guten Abend','Begrüßung am Abend.',2,{ introducesVocabulary:['dober večer'], learningTargets:['vocab:dober večer'] }),
  intro('lahko-noc',23,'Lahko noč','Gute Nacht','Beim Verabschieden vor dem Schlafengehen.',2,{ introducesVocabulary:['lahko noč'], learningTargets:['vocab:lahko noč'] }),
  intro('nasvidenje',24,'Nasvidenje','Auf Wiedersehen','Neutrale Verabschiedung.',2),
  { id:'p2-greetings-meaning', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „Dober večer“?', answer:'Guten Abend', alternatives:['Guten Abend','Guten Morgen','Gute Nacht'], requiredVocabulary:['dober večer'], learningTargets:['vocab:dober večer'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:2, curriculumOrder:25, contentKey:'dober-vecer-meaning' },
  { id:'p2-morning-listen', lesson:1, type:'listen-choice', modality:'listening', prompt:'Welche Begrüßung hörst du?', audioPrompt:'Dobro jutro', answer:'Guten Morgen', alternatives:['Guten Morgen','Guten Tag','Auf Wiedersehen'], requiredVocabulary:['dobro jutro'], learningTargets:['vocab:dobro jutro'], level:'A1', difficulty:1, skills:['hören','wortschatz'], learningPhase:'recognition', curriculumPhase:2, curriculumOrder:26, contentKey:'dobro-jutro-listen' },
  { id:'p2-day-recall', lesson:1, type:'choice', modality:'choice', prompt:'Wie sagst du tagsüber „Guten Tag“?', answer:'Dober dan', alternatives:['Dober dan','Dobro jutro','Lahko noč'], requiredVocabulary:['dober dan'], learningTargets:['vocab:dober dan'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recall', curriculumPhase:2, curriculumOrder:27, requiredTargetStage:'recognition', contentKey:'dober-dan-recall' },

  // PHASE 3 — first mini-dialog, still mostly receptive.
  intro('kako-si',30,'Kako si?','Wie geht es dir?','Informelle Frage an eine Person.',3,{ introducesVocabulary:['kako si'], learningTargets:['vocab:kako si'] }),
  intro('dobro',31,'Dobro','Gut','Eine einfache Antwort auf „Kako si?“.',3),
  intro('in-ti',32,'In ti?','Und dir?','Du gibst dieselbe Frage zurück.',3,{ introducesVocabulary:['in ti'], learningTargets:['vocab:in ti'] }),
  { id:'p3-dialog-response', lesson:1, type:'choice', modality:'choice', prompt:'A: Kako si?  B: ___', answer:'Dobro, hvala.', alternatives:['Dobro, hvala.','Lahko noč.','Nasvidenje.'], acceptedAnswers:['Dobro hvala','Dobro. Hvala.'], requiredVocabulary:['kako si','dobro','hvala'], learningTargets:['vocab:kako si','vocab:dobro'], level:'A1', difficulty:2, skills:['lesen','wortschatz'], learningPhase:'application', curriculumPhase:3, curriculumOrder:33, contentKey:'kako-si-dialog' },
  { id:'p3-dialog-listen', lesson:1, type:'listen-choice', modality:'listening', prompt:'Höre die Frage. Welche Antwort passt?', audioPrompt:'Kako si?', answer:'Dobro, hvala.', alternatives:['Dobro, hvala.','Dober večer.','Ne.'], requiredVocabulary:['kako si','dobro','hvala'], learningTargets:['vocab:kako si','vocab:dobro'], level:'A1', difficulty:2, skills:['hören','wortschatz'], learningPhase:'application', curriculumPhase:3, curriculumOrder:34, contentKey:'kako-si-listen-response' },

  // PHASE 4 — pronouns, no verb table yet.
  intro('jaz',40,'Jaz','Ich','Personalpronomen für „ich“.',4),
  intro('ti',41,'Ti','Du','Personalpronomen für „du“.',4),
  intro('on',42,'On','Er','Personalpronomen für „er“.',4),
  intro('ona',43,'Ona','Sie','Personalpronomen für „sie“.',4),
  { id:'p4-jaz-ti', lesson:1, type:'choice', modality:'choice', prompt:'Welches Wort bedeutet „ich“?', answer:'jaz', alternatives:['jaz','ti','on'], requiredVocabulary:['jaz','ti'], learningTargets:['vocab:jaz'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:4, curriculumOrder:44, contentKey:'jaz-recognition' },

  // PHASE 5 — only sem and si first.
  intro('sem',50,'Sem','Ich bin','Erste Form von biti = sein. Beispiel: Sem Dejan.',5,{ introducesVocabulary:['sem'], introducesGrammar:['biti-sem'], learningTargets:['vocab:sem','grammar:biti-sem'] }),
  intro('si',51,'Si','Du bist','Zweite Form von biti = sein. Beispiel: Ti si Ana.',5,{ introducesVocabulary:['si'], introducesGrammar:['biti-si'], learningTargets:['vocab:si','grammar:biti-si'] }),
  intro('doma',52,'Doma','Zu Hause','Beschreibt, dass jemand an einem Ort zu Hause ist.',5),
  { id:'p5-sem-meaning', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „sem“ hier?', answer:'ich bin', alternatives:['ich bin','du bist','er ist'], requiredVocabulary:['sem'], requiredGrammar:['biti-sem'], learningTargets:['vocab:sem','grammar:biti-sem'], level:'A1', difficulty:1, skills:['lesen','grammatik'], learningPhase:'recognition', curriculumPhase:5, curriculumOrder:53, contentKey:'sem-recognition' },
  { id:'p5-si-meaning', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „si“ hier?', answer:'du bist', alternatives:['du bist','ich bin','sie ist'], requiredVocabulary:['si'], requiredGrammar:['biti-si'], learningTargets:['vocab:si','grammar:biti-si'], level:'A1', difficulty:1, skills:['lesen','grammatik'], learningPhase:'recognition', curriculumPhase:5, curriculumOrder:54, contentKey:'si-recognition' },
  { id:'p5-jaz-sem', lesson:1, type:'choice', modality:'choice', prompt:'Jaz ___ Dejan.', answer:'sem', alternatives:['sem','si'], requiredVocabulary:['jaz','sem'], requiredGrammar:['biti-sem'], learningTargets:['grammar:biti-sem'], level:'A1', difficulty:2, skills:['grammatik','lesen'], learningPhase:'application', curriculumPhase:5, curriculumOrder:55, requiredTargetStage:'recognition', contentKey:'jaz-sem-choice' },
  { id:'p5-ti-si', lesson:1, type:'choice', modality:'choice', prompt:'Ti ___ Ana.', answer:'si', alternatives:['si','sem'], requiredVocabulary:['ti','si'], requiredGrammar:['biti-si'], learningTargets:['grammar:biti-si'], level:'A1', difficulty:2, skills:['grammatik','lesen'], learningPhase:'application', curriculumPhase:5, curriculumOrder:56, requiredTargetStage:'recognition', contentKey:'ti-si-choice' },
  { id:'p5-sem-doma-recall', lesson:1, type:'fill', modality:'text', prompt:'Ergänze den bekannten Mini-Satz: ___ doma. (Ich bin zu Hause.)', answer:'Sem', acceptedAnswers:['sem'], requiredVocabulary:['sem','doma'], requiredGrammar:['biti-sem'], learningTargets:['grammar:biti-sem','pattern:sem-doma'], level:'A1', difficulty:2, skills:['schreiben','grammatik'], learningPhase:'recall', curriculumPhase:5, curriculumOrder:57, requiredTargetStage:'recognition', contentKey:'sem-doma-recall' },

  // PHASE 6 — je only after sem/si.
  intro('je',60,'Je','Er / sie / es ist','Dritte häufige Form von biti. Beispiel: Ona je Ana.',6,{ introducesVocabulary:['je'], introducesGrammar:['biti-je'], learningTargets:['vocab:je','grammar:biti-je'] }),
  { id:'p6-je-recognition', lesson:1, type:'choice', modality:'choice', prompt:'Ona ___ Ana.', answer:'je', alternatives:['je','sem','si'], requiredVocabulary:['ona','je'], requiredGrammar:['biti-je'], learningTargets:['grammar:biti-je'], level:'A1', difficulty:2, skills:['lesen','grammatik'], learningPhase:'recognition', curriculumPhase:6, curriculumOrder:61, contentKey:'ona-je' },

  // PHASE 7–9 introductions. Full productive grammar waits until phase 10.
  intro('od-kod',70,'Od kod si?','Woher kommst du?','Frage nach der Herkunft.',7,{ introducesVocabulary:['od kod'], learningTargets:['vocab:od kod'] }),
  intro('iz',71,'Iz','Aus','Wird in einfachen Herkunftsangaben verwendet.',7),
  intro('slovenija',72,'Slovenija','Slowenien','Name des Landes Slowenien.',7),
  intro('nemcija',73,'Nemčija','Deutschland','Name des Landes Deutschland.',7),
  { id:'p7-origin-recognition', lesson:1, type:'choice', modality:'choice', prompt:'Was fragt „Od kod si?“', answer:'Woher kommst du?', alternatives:['Woher kommst du?','Wo wohnst du?','Wohin gehst du?'], requiredVocabulary:['od kod'], learningTargets:['vocab:od kod'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:7, curriculumOrder:74, contentKey:'od-kod-meaning' },

  intro('kje',80,'Kje?','Wo?','Fragt nach einem Ort.',8,{ introducesGrammar:['kje-question'], learningTargets:['vocab:kje','grammar:kje-question'] }),
  intro('zivim',81,'Živim','Ich wohne','Häufige Form für den eigenen Wohnort.',8),
  intro('zivis',82,'Živiš','Du wohnst','Form für „du wohnst“.',8),
  intro('v',83,'V','In','Häufige Präposition für Ortsangaben.',8),
  { id:'p8-kje-recognition', lesson:1, type:'choice', modality:'choice', prompt:'Welche Frage bedeutet „Wo?“', answer:'Kje?', alternatives:['Kje?','Kam?','Od kod?'], acceptedAnswers:['Kje','kje'], requiredVocabulary:['kje'], learningTargets:['vocab:kje'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:8, curriculumOrder:84, contentKey:'kje-recognition' },

  intro('kam',90,'Kam?','Wohin?','Fragt nach einer Richtung oder einem Ziel.',9,{ introducesGrammar:['kam-question'], learningTargets:['vocab:kam','grammar:kam-question'] }),
  intro('grem',91,'Grem','Ich gehe','Häufige Form, wenn du sagst, wohin du gehst.',9),
  intro('domov',92,'Domov','Nach Hause','Beschreibt eine Richtung: nach Hause.',9),
  { id:'p9-kam-recognition', lesson:1, type:'choice', modality:'choice', prompt:'Welche Frage bedeutet „Wohin?“', answer:'Kam?', alternatives:['Kam?','Kje?','Kako?'], acceptedAnswers:['Kam','kam'], requiredVocabulary:['kam'], learningTargets:['vocab:kam'], level:'A1', difficulty:1, skills:['lesen','wortschatz'], learningPhase:'recognition', curriculumPhase:9, curriculumOrder:93, contentKey:'kam-recognition' },
  { id:'p9-grem-domov', lesson:1, type:'choice', modality:'choice', prompt:'Was bedeutet „Grem domov“?', answer:'Ich gehe nach Hause.', alternatives:['Ich gehe nach Hause.','Ich bin zu Hause.','Ich wohne hier.'], requiredVocabulary:['grem','domov'], learningTargets:['vocab:grem','vocab:domov'], level:'A1', difficulty:2, skills:['lesen','wortschatz'], learningPhase:'application', curriculumPhase:9, curriculumOrder:94, contentKey:'grem-domov-meaning' },

  // PHASE 10 — explicit grammar only after both concepts are known.
  { id:'p10-kje-kam-intro', lesson:1, type:'introduce', modality:'text', prompt:'Grammatik neu: KJE oder KAM?', answer:'KJE = Wo? · KAM = Wohin?', introSl:'KJE oder KAM?', introDe:'KJE = Wo? · KAM = Wohin?', introUsage:'KJE fragt nach einem Ort. KAM fragt nach einer Richtung. Beispiel: Sem v Sloveniji. / Grem v Slovenijo.', audioPrompt:'Kje si? Kam greš?', requiredVocabulary:['kje','kam','grem','v','Slovenija'], introducesGrammar:['location-direction'], learningTargets:['grammar:location-direction'], level:'A1', difficulty:1, skills:['grammatik','lesen'], learningPhase:'new', curriculumPhase:10, curriculumOrder:100, contentKey:'kje-kam-grammar-intro' },
  { id:'p10-kje-kam-choice', lesson:1, type:'choice', modality:'choice', prompt:'Du fragst nach einem Ort: ___ si?', answer:'Kje', alternatives:['Kje','Kam'], requiredVocabulary:['kje','kam'], requiredGrammar:['location-direction'], learningTargets:['grammar:location-direction'], level:'A1', difficulty:1, skills:['grammatik','lesen'], learningPhase:'recognition', curriculumPhase:10, curriculumOrder:101, contentKey:'kje-kam-question-choice' },
  { id:'p10-location-direction-rec', lesson:1, type:'choice', modality:'choice', prompt:'Welche Antwort beschreibt eine Richtung?', answer:'Grem v Slovenijo.', alternatives:['Grem v Slovenijo.','Sem v Sloveniji.'], requiredVocabulary:['grem','v','Slovenija'], requiredGrammar:['location-direction'], learningTargets:['grammar:location-direction'], level:'A1', difficulty:2, skills:['grammatik','lesen'], learningPhase:'recognition', curriculumPhase:10, curriculumOrder:102, contentKey:'location-direction-recognition' },
]
