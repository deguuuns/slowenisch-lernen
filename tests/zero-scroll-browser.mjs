import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const base='http://127.0.0.1:3000/qa-zero-scroll'
const outDir=path.resolve('artifacts/zero-scroll')
fs.mkdirSync(outDir,{recursive:true})

const viewports=[{width:375,height:667,name:'375x667'},{width:390,height:844,name:'390x844'},{width:393,height:852,name:'393x852'},{width:430,height:932,name:'430x932'}]
const cases=['choice-long','input-long','wordbank','conjugation','dual','listening','speaking']

async function metrics(page){return page.evaluate(()=>{const root=document.querySelector('[data-learning-focus-root]'),body=document.body,html=document.documentElement,main=document.querySelector('body > main');return {innerHeight:window.innerHeight,visualHeight:window.visualViewport?.height||window.innerHeight,documentScrollHeight:html.scrollHeight,bodyScrollHeight:body.scrollHeight,rootScrollHeight:root?.scrollHeight||0,rootBottom:root?.getBoundingClientRect().bottom||0,mainDisplay:main?getComputedStyle(main).display:'missing'}})}
function assertFits(label,m){const tolerance=2;assert.ok(m.documentScrollHeight<=m.innerHeight+tolerance,`${label}: document ${m.documentScrollHeight}px > viewport ${m.innerHeight}px`);assert.ok(m.bodyScrollHeight<=m.innerHeight+tolerance,`${label}: body ${m.bodyScrollHeight}px > viewport ${m.innerHeight}px`);assert.ok(m.rootBottom<=m.visualHeight+tolerance,`${label}: focus root bottom ${m.rootBottom}px > visible ${m.visualHeight}px`);assert.equal(m.mainDisplay,'none',`${label}: normal app shell is still visible`)}
async function openCase(page,kind,theme='light'){await page.goto(`${base}?case=${kind}${theme==='dark'?'&theme=dark':''}`,{waitUntil:'networkidle'});await page.waitForSelector('[data-learning-focus-root]')}
async function openWorkspace(page){await page.goto(`${base}?case=vocab-workspace`,{waitUntil:'networkidle'});await page.getByRole('button',{name:'Vokabeltest'}).waitFor()}

const browser=await chromium.launch({headless:true,channel:'chrome'})
try{
  for(const viewport of viewports){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}}),page=await context.newPage()
    for(const kind of cases){await openCase(page,kind);assertFits(`${viewport.name} ${kind}`,await metrics(page));if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-${kind}.png`),fullPage:true})}

    // Multiple choice is editable until the explicit Prüfen action.
    await openCase(page,'choice-long')
    const firstChoice=page.getByRole('button',{name:/Ich habe heute leider keine Zeit und komme deshalb erst morgen/})
    const secondChoice=page.getByRole('button',{name:/Ich habe heute sehr viel Zeit und kann sofort kommen/})
    await firstChoice.click();assert.equal(await firstChoice.getAttribute('aria-pressed'),'true');assert.equal(await page.getByText('Richtig',{exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Weiter'}).count(),0)
    await secondChoice.click();assert.equal(await secondChoice.getAttribute('aria-pressed'),'true');assert.equal(await firstChoice.getAttribute('aria-pressed'),'false')
    await firstChoice.click();await page.getByRole('button',{name:'Prüfen'}).click();assert.ok(await page.getByText('Richtig',{exact:true}).count());assertFits(`${viewport.name} choice-feedback`,await metrics(page))

    await openCase(page,'input-long')
    for(const character of ['Č','Š','Ž'])assert.equal(await page.getByRole('button',{name:character,exact:true}).count(),0,`Special-character toolbar must not contain ${character}`)

    await openCase(page,'long-feedback');await page.getByLabel('Deine Antwort').fill('Imam dve brata.');await page.getByRole('button',{name:'Prüfen'}).click();assertFits(`${viewport.name} wrong-feedback`,await metrics(page));if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-feedback-wrong.png`),fullPage:true})
    await openCase(page,'dual');await page.getByLabel('Deine Antwort').fill('Imam dva brata.');await page.getByRole('button',{name:'Prüfen'}).click();assertFits(`${viewport.name} correct-feedback`,await metrics(page))

    await openCase(page,'error-review');await page.getByLabel('Deine Antwort').fill('Imam dve brata.');await page.getByRole('button',{name:'Prüfen'}).click();assertFits(`${viewport.name} error-feedback`,await metrics(page));await page.getByRole('button',{name:'Weiter'}).click();await page.getByRole('button',{name:/dve sestri/i}).click();assert.equal(await page.getByRole('button',{name:'Weiter'}).count(),0);await page.getByRole('button',{name:'Prüfen'}).click();assertFits(`${viewport.name} second-error-feedback`,await metrics(page));await page.getByRole('button',{name:/Gezielt wiederholen|Sitzung abschließen/}).click();assertFits(`${viewport.name} remediation`,await metrics(page))

    await openWorkspace(page);await page.getByRole('button',{name:'Vokabeltest'}).click();await page.waitForSelector('[data-learning-focus-root]');assertFits(`${viewport.name} real-vocabulary-test`,await metrics(page));if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-vocabulary-test.png`),fullPage:true});await page.getByRole('button',{name:'Zurück'}).click();await page.waitForSelector('[data-learning-focus-root]',{state:'detached'});await page.getByRole('button',{name:'Konjugation'}).click();await page.waitForSelector('[data-learning-focus-root]');assertFits(`${viewport.name} real-conjugation`,await metrics(page));if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-conjugation.png`),fullPage:true})
    await openCase(page,'input-long','dark');assertFits(`${viewport.name} dark`,await metrics(page));if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-dark.png`),fullPage:true});await context.close()
  }

  const keyboardContext=await browser.newContext({viewport:{width:375,height:390}}),keyboardPage=await keyboardContext.newPage();await openCase(keyboardPage,'input-long');const input=keyboardPage.getByLabel('Deine Antwort');await input.focus();await keyboardPage.waitForFunction(()=>document.documentElement.dataset.keyboardFocus==='true');assertFits('375x390 keyboard-focus',await metrics(keyboardPage));const inputBox=await input.boundingBox(),buttonBox=await keyboardPage.getByRole('button',{name:'Prüfen'}).boundingBox();assert.ok(inputBox&&inputBox.y+inputBox.height<=390,'Keyboard focus: input is outside visible area');assert.ok(buttonBox&&buttonBox.y+buttonBox.height<=390,'Keyboard focus: Prüfen button is outside visible area');await keyboardPage.screenshot({path:path.join(outDir,'375x390-keyboard-focus.png'),fullPage:true});await keyboardContext.close()

  const overviewContext=await browser.newContext({viewport:{width:390,height:844}}),overviewPage=await overviewContext.newPage();await overviewPage.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle'});for(let step=0;step<2;step++)await overviewPage.getByRole('button',{name:'Weiter'}).click();await overviewPage.getByRole('button',{name:'Lernen starten'}).click();await overviewPage.getByRole('heading',{name:'Bereit für eine Runde?'}).waitFor();await overviewPage.screenshot({path:path.join(outDir,'390x844-start.png'),fullPage:true});await overviewPage.getByRole('navigation').last().getByRole('button',{name:'Vokabeln'}).click();await overviewPage.getByRole('heading',{name:'Vokabeln'}).waitFor();await overviewPage.screenshot({path:path.join(outDir,'390x844-vocabulary-overview.png'),fullPage:true});await overviewPage.getByRole('navigation').last().getByRole('button',{name:'Fortschritt'}).click();await overviewPage.getByText('Fortschritt',{exact:true}).first().waitFor();await overviewPage.screenshot({path:path.join(outDir,'390x844-progress.png'),fullPage:true});await overviewContext.close()
  console.log('Zero-scroll, explicit-submit and overview QA passed.')
} finally {await browser.close()}
