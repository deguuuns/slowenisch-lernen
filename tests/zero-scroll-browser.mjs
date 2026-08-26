import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const base='http://127.0.0.1:3000/qa-zero-scroll'
const outDir=path.resolve('artifacts/zero-scroll')
fs.mkdirSync(outDir,{recursive:true})

const viewports=[
  {width:375,height:667,name:'375x667'},
  {width:390,height:844,name:'390x844'},
  {width:393,height:852,name:'393x852'},
  {width:430,height:932,name:'430x932'},
]
const cases=['choice-long','input-long','wordbank','conjugation','dual','listening','speaking']

async function metrics(page){
  return page.evaluate(()=>{
    const root=document.querySelector('[data-learning-focus-root]')
    const body=document.body
    const html=document.documentElement
    return {
      innerHeight:window.innerHeight,
      visualHeight:window.visualViewport?.height||window.innerHeight,
      documentScrollHeight:html.scrollHeight,
      bodyScrollHeight:body.scrollHeight,
      rootScrollHeight:root?.scrollHeight||0,
      rootBottom:root?.getBoundingClientRect().bottom||0,
      mainDisplay:getComputedStyle(document.querySelector('body > main')||body).display,
    }
  })
}

function assertFits(label,m){
  const tolerance=2
  assert.ok(m.documentScrollHeight<=m.innerHeight+tolerance,`${label}: document ${m.documentScrollHeight}px > viewport ${m.innerHeight}px`)
  assert.ok(m.bodyScrollHeight<=m.innerHeight+tolerance,`${label}: body ${m.bodyScrollHeight}px > viewport ${m.innerHeight}px`)
  assert.ok(m.rootBottom<=m.visualHeight+tolerance,`${label}: focus root bottom ${m.rootBottom}px > visible ${m.visualHeight}px`)
  assert.equal(m.mainDisplay,'none',`${label}: normal app shell is still visible`)
}

async function openCase(page,kind,theme='light'){
  await page.goto(`${base}?case=${kind}${theme==='dark'?'&theme=dark':''}`,{waitUntil:'networkidle'})
  await page.waitForSelector('[data-learning-focus-root]')
}

const browser=await chromium.launch({headless:true})
try{
  for(const viewport of viewports){
    const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}})
    const page=await context.newPage()
    for(const kind of cases){
      await openCase(page,kind)
      assertFits(`${viewport.name} ${kind}`,await metrics(page))
      if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-${kind}.png`),fullPage:true})
    }

    await openCase(page,'long-feedback')
    await page.getByLabel('Deine Antwort').fill('Imam dve brata.')
    await page.getByRole('button',{name:'Prüfen'}).click()
    assertFits(`${viewport.name} wrong-feedback`,await metrics(page))
    if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-feedback-wrong.png`),fullPage:true})

    await openCase(page,'dual')
    await page.getByLabel('Deine Antwort').fill('Imam dva brata.')
    await page.getByRole('button',{name:'Prüfen'}).click()
    assertFits(`${viewport.name} correct-feedback`,await metrics(page))

    await openCase(page,'error-review')
    await page.getByLabel('Deine Antwort').fill('Imam dve brata.')
    await page.getByRole('button',{name:'Prüfen'}).click()
    assertFits(`${viewport.name} error-feedback`,await metrics(page))
    await page.getByRole('button',{name:'Weiter'}).click()
    const wrongChoice=page.getByRole('button',{name:/dva sestri/i})
    await wrongChoice.click()
    assertFits(`${viewport.name} second-error-feedback`,await metrics(page))
    await page.getByRole('button',{name:/Fehler wiederholen|Sitzung abschließen/}).click()
    assertFits(`${viewport.name} remediation`,await metrics(page))

    await openCase(page,'input-long','dark')
    assertFits(`${viewport.name} dark`,await metrics(page))
    if(viewport.name==='375x667')await page.screenshot({path:path.join(outDir,`${viewport.name}-dark.png`),fullPage:true})
    await context.close()
  }

  const keyboardContext=await browser.newContext({viewport:{width:375,height:390}})
  const keyboardPage=await keyboardContext.newPage()
  await openCase(keyboardPage,'input-long')
  const input=keyboardPage.getByLabel('Deine Antwort')
  await input.focus()
  await keyboardPage.waitForFunction(()=>document.documentElement.dataset.keyboardFocus==='true')
  const keyboardMetrics=await metrics(keyboardPage)
  assertFits('375x390 keyboard-focus',keyboardMetrics)
  const inputBox=await input.boundingBox()
  const buttonBox=await keyboardPage.getByRole('button',{name:'Prüfen'}).boundingBox()
  assert.ok(inputBox&&inputBox.y+inputBox.height<=390,'Keyboard focus: input is outside visible area')
  assert.ok(buttonBox&&buttonBox.y+buttonBox.height<=390,'Keyboard focus: Prüfen button is outside visible area')
  await keyboardPage.screenshot({path:path.join(outDir,'375x390-keyboard-focus.png'),fullPage:true})
  await keyboardContext.close()

  console.log('Zero-scroll browser checks passed for all required phone viewports and keyboard simulation.')
} finally {
  await browser.close()
}
