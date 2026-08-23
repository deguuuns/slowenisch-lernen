import assert from 'node:assert/strict'
import { buildCaseContrastPractice, buildCoreMorphologyPractice, buildDualNumeralPractice, buildNounFormPractice } from '../lib/morphology-practice'

assert.equal(buildCaseContrastPractice('Slovenija','location')?.expected,'Sloveniji')
assert.equal(buildCaseContrastPractice('Slovenija','direction')?.expected,'Slovenijo')
assert.equal(buildCaseContrastPractice('Nemčija','location')?.expected,'Nemčiji')
assert.equal(buildDualNumeralPractice('brat')?.expected,'dva')
assert.equal(buildDualNumeralPractice('sestra')?.expected,'dve')
assert.equal(buildNounFormPractice('brat','dual','nominative')?.expected,'brata')
assert.equal(buildNounFormPractice('sestra','plural','nominative')?.expected,'sestre')
const deck=buildCoreMorphologyPractice()
assert.ok(deck.some(item=>item.targetKey==='grammar:dual'))
assert.ok(deck.some(item=>item.targetKey==='grammar:case:locative'))
assert.ok(deck.some(item=>item.targetKey==='grammar:case:accusative'))
console.log('Morphology practice checks passed')
