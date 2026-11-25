'use strict';
const assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const base=(process.argv[2]||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const engines=process.argv[3]==='chromium'?[['Chromium',chromium]]:process.argv[3]==='webkit'?[['WebKit',webkit]]:[['Chromium',chromium],['WebKit',webkit]];
(async()=>{
 let checks=0;
 const ok=(x,msg)=>{assert(x,msg);checks++};
 for(const [engineName,engine] of engines){
  const browser=await engine.launch({headless:true});
  try{
   for(const width of [320,390]){
    for(const grade of ['grade8','grade9']){
     const ctx=await browser.newContext({viewport:{width,height:width===320?640:844},locale:'sv-SE',serviceWorkers:'block'});
     const p=await ctx.newPage(),errors=[];
     p.on('pageerror',e=>errors.push(e.message));
     await p.goto(base,{waitUntil:'domcontentloaded'});
     await p.locator('.pc-onboarding .pc-'+grade).click();
     await p.locator('.ux-tiles .ux-tile').first().waitFor();
     ok(await p.locator('.ux-tiles .ux-tile').count()===4,'main four choices');
     ok(await p.locator('.ux-swedish').getAttribute('href')==='lara/#/studio/sv','new main Swedish destination');
     ok(await p.locator('.ux-english').getAttribute('href')==='lara/#/studio/en','new main English destination');
     ok(await p.locator('.ux-play').getAttribute('href')==='lara/#/spel','new games selector');
     await p.locator('.ux-swedish').click();
     await p.locator('[data-ls-screen=hub]').waitFor();
     ok(await p.locator('.ls-shelf-grid > a').count()===6,'six Swedish strands');
     ok(await p.locator('.ls-game-grid > a').count()===4,'four games');
     const safe=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,header:document.querySelector('.ls-hero')?.innerText||''}));
     ok(safe.scroll<=safe.width+2,'Swedish hub no horizontal overflow '+JSON.stringify(safe));
     ok(safe.header.toLocaleLowerCase('sv-SE').includes(grade==='grade8'?'årskurs 8':'årskurs 9'),'grade prominently displayed');
     await p.locator('.ls-shelf-grid a').first().click();
     await p.locator('[data-ls-screen=area]').waitFor();
     ok(await p.locator('.ls-unit-row').count()>=2,'core study moments');
     await p.locator('.ls-unit-row').first().click();
     await p.locator('[data-ls-screen=unit]').waitFor();
     ok(await p.locator('.ls-guide-panel').isVisible(),'lesson with scaffold');
     const unitId=new URL(p.url()).hash.split('/').at(-1);
     await p.locator('.ls-primary-link').click();
     await p.locator('[data-ls-screen=quiz]').waitFor();
     ok(await p.locator('.ls-answer').count()===4,'first multiple choice');
     const answers=await p.evaluate(({id,grade})=>{
      const u=window.MOL_STUDIO_DATA.units.find(x=>x.id===id);
      return window.MOL_STUDIO.quizQuestions(u,grade).map(x=>x.answer);
     },{id:unitId,grade});
     for(let i=0;i<2;i++){
      await p.locator('.ls-answer').nth(answers[i]).click();
      await p.locator('[data-ls=check]').click();
      ok((await p.locator('.ls-feedback').innerText()).length>20,'feedback explains answer');
      await p.locator('[data-ls=next]').click();
     }
     await p.locator('[data-ls-screen=quiz-end]').waitFor();
     ok((await p.locator('.ls-finish').innerText()).includes('2 / 2'),'question results');
     const saved=await p.evaluate(()=>localStorage.getItem('matteos.studio.v1'));
     ok(saved===null,'no new sensitive learner storage');
     await p.goto(base+'lara/#/studio/sv/write/'+unitId,{waitUntil:'domcontentloaded'});
     await p.locator('#ls-draft').fill('Första försöket med egna ord. Det är ett test, inte elevinformation.');
     await p.locator('[data-ls=checklist]').click();
     ok((await p.locator('#ls-draft').inputValue()).includes('Första försöket'),'draft survives showing feedback');
     ok(await p.locator('.ls-feedback').isVisible(),'writing checklist works');
     await p.goto(base+'lara/#/studio/sv/talk/'+unitId,{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=talk]').waitFor();
     ok(await p.locator('.ls-talk-steps').isVisible(),'speaking practice');
     await p.goto(base+'lara/#/studio/en',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=hub]').waitFor();
     ok(await p.locator('.ls-shelf-grid > a').count()===7,'seven English strands');
     await p.goto(base+'lara/#/studio/en/area/Listening',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=area]').waitFor();
     ok(await p.locator('.ls-unit-row').count()>=2,'English listening lessons');
     await p.locator('.ls-unit-row').first().click();
     await p.locator('[data-ls-screen=unit]').waitFor();
     ok(await p.locator('[data-ls=listen-example]').isVisible(),'audio example offered in Listening');
     await p.locator('[data-ls=listen-example]').click();
     ok((await p.locator('#ls-voice-status').innerText()).length>10,'audio or human-reader fallback text');
     await p.goto(base+'lara/#/spel',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=game-hub]').waitFor();
     ok(await p.locator('.ls-game-grid .ls-game-link').count()===10,'8 language game choices plus the two debate-game entries (sv, en)');
     ok(await p.locator('.ls-game-grid .ls-game-link[href^="debatt.html"]').count()===2,'debate game linked in both languages');
     ok(await p.locator('a[href^="../tillsammans/"]').count()>=1,'existing group games remain available');
     await p.goto(base+'lara/#/studio-game/sv/quiz/solo',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=game-quiz]').waitFor();
     const deck=await p.evaluate(grade=>window.MOL_STUDIO.gameDeck('sv',grade,'quiz').map(x=>x.question.answer),grade);
     for(let i=0;i<5;i++){
      await p.locator('.ls-answer').nth(deck[i]).click();
      await p.locator('[data-ls=check]').click();
      await p.locator('[data-ls=next]').click();
     }
     await p.locator('[data-ls-screen=game-end]').waitFor();
     ok((await p.locator('.ls-finish').innerText()).includes('5 / 5'),'quiz game fully playable');
     await p.locator('[data-ls=restart]').click();
     ok(await p.locator('[data-ls-screen=game-quiz]').count()===1,'quiz can restart');
     await p.goto(base+'lara/#/studio-game/en/quiz/pair',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=game-quiz]').waitFor();
     ok((await p.locator('.ls-game-head').innerText()).includes('Player 1'),'pair turn 1');
     await p.locator('.ls-answer').first().click();
     await p.locator('[data-ls=check]').click();
     await p.locator('[data-ls=next]').click();
     ok((await p.locator('.ls-game-head').innerText()).includes('Player 2'),'pair turn 2');
     await p.goto(base+'lara/#/studio-game/sv/match/solo',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=match]').waitFor();
     const pairs=await p.evaluate(grade=>window.MOL_STUDIO.matchDeck('sv',grade).map(x=>x.id),grade);
     for(const pair of pairs){
      await p.locator('[data-ls=match-term]').filter({has:p.locator('[data-id="'+pair+'"]')}).count().catch(()=>{});
      await p.locator('button[data-ls="match-term"][data-id="'+pair+'"]').click();
      await p.locator('button[data-ls="match-meaning"][data-id="'+pair+'"]').click();
     }
     ok((await p.locator('.ls-finish').innerText()).includes('alla par'),'match game completed');
     await p.goto(base+'lara/#/studio-game/en/order/solo',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=order]').waitFor();
     const steps=await p.evaluate(grade=>window.MOL_STUDIO.orderDeck('en',grade).map(x=>x.items),grade);
     for(const seq of steps){
      for(const item of seq){
       await p.locator('button[data-ls="pick-order"]').filter({hasText:item}).click();
      }
      await p.locator('[data-ls=check-order]').click();
      await p.locator('[data-ls=next]').click();
     }
     ok(await p.locator('[data-ls-screen=game-end]').count()===1,'ordering game completes');
     await p.goto(base+'lara/#/studio-game/en/talk/pair',{waitUntil:'domcontentloaded'});
     await p.locator('[data-ls-screen=talk-game]').waitFor();
     for(let i=0;i<6;i++)await p.locator('[data-ls=next]').click();
     ok((await p.locator('.ls-finish').innerText()).includes('Well done'),'talk cards finish');
     await p.goto(base+'lara/#/texter/en',{waitUntil:'domcontentloaded'});
     await p.locator('.wk-feature').waitFor({timeout:13000});
     ok(await p.locator('.wk-feature').count()>0,'existing reading studio preserved');
     const final=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth}));
     ok(final.scroll<=final.width+2,'no horizontal scroll on legacy reading');
     ok(errors.length===0,engineName+' '+width+' '+grade+' zero page errors '+errors.join(' | '));
     await ctx.close();
    }
   }
  }finally{await browser.close();}
 }
 console.log('LANGUAGE STUDIO E2E '+checks+'/'+checks+' PASS');
})().catch(e=>{console.error(e);process.exit(1)});
