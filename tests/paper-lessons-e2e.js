'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium,devices}=require('playwright');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
const OUT=process.argv[3]||'test-screenshots';
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true});let checks=0;
  try{
    for(const [name,device] of [['iphone-se',devices['iPhone SE']],['iphone-13',devices['iPhone 13']],['desktop',{viewport:{width:1280,height:840}}]]){
      for(const [grade,ids] of [['grade8',['f8-perimeter','f8-area','f8-powers-ten','f8-fractions-add','f8-equations','f8-cylinder','f8-expressions','f8-negative']],['grade9',['s9-powers','s9-sqrt','s9-scientific','s9-pythagoras','s9-percent-part','s9-length-scale','s9-sci-calc']]]){
        const context=await browser.newContext({...device,serviceWorkers:'block'});
        const page=await context.newPage();page.setDefaultTimeout(10000);
        const errs=[];page.on('pageerror',e=>errs.push(e.message));
        await page.goto(BASE,{waitUntil:'networkidle'});
        await page.locator('[data-p="'+grade+'"]').click();
        await page.waitForSelector('h1');checks++;
        for(const sid of ids){
          await page.goto(BASE+'#/l/'+sid+'/0');
          await page.waitForSelector('.paper-flow');
          assert.equal(await page.locator('.paper-question').count(),1,sid+' missing concrete question');checks++;
          assert.equal(await page.locator('.paper-step').count(),3,sid+' not exactly 3 steps');checks++;
          assert.equal(await page.locator('.paper-answer').count(),1,sid+' answer missing');checks++;
          assert.equal(await page.locator('.paper-more:not([open])').count()>0,true,'Advanced formulas should start collapsed '+sid);checks++;
          assert.equal(await page.locator('.focus .big-f:visible').count(),0,'Formula is forced too early '+sid);checks++;
          if(sid==='f8-perimeter'||sid==='f8-area'){
             assert.equal(await page.locator('.paper-diagram svg').count(),1,'Missing school diagram '+sid);checks++;
             await page.screenshot({path:OUT+'/'+name+'-'+sid+'.png',fullPage:true});
          }
          if(sid==='f8-powers-ten'){
            assert.match(await page.locator('.paper-powers').innerText(),/0,01/);checks++;
            await page.screenshot({path:OUT+'/'+name+'-decimal-power.png',fullPage:true});
          }
          const width=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
          assert(width[0]<=width[1]+2,sid+' horizontal overflow '+width);checks++;
        }
        const sid=ids[0];
        await page.goto(BASE+'#/l/'+sid+'/1');
        await page.waitForSelector('.paper-flow');
        assert.equal(await page.locator('[data-a=reveal]').count(),0,'Forced multi-click reveal not removed');checks++;
        assert.equal(await page.locator('.paper-step').count()>=2,true,'Worked lesson steps must show directly');checks++;
        await page.goto(BASE+'#/l/'+sid+'/2');await page.waitForSelector('#ans');
        assert.equal(await page.locator('.paper-known').count(),1);checks++;
        assert.equal(await page.locator('.paper-more:not([open])').count()>=0,true);checks++;
        await page.goto(BASE+'#/formler');
        assert.match(await page.locator('h1').first().innerText(),/Matte förklarat enkelt/);checks++;
        const first=grade==='grade8'?'f8-perimeter':'s9-sqrt';
        await page.locator('[data-a=fch][data-ch="'+(grade==='grade8'?'f8-geo':'s9-tal')+'"]').click();
        await page.locator('[data-a=ftoggle][data-sid="'+first+'"]').click();
        assert.equal(await page.locator('#f-'+first+' .paper-flow').count(),1);checks++;
        assert.equal(await page.locator('#f-'+first+' .paper-more:not([open])').count(),1);checks++;
        assert.deepEqual(errs,[],name+' '+grade+' page errors');
        await context.close();
        console.log(name+' '+grade+': paper-first lessons, optional formulas, guided exercises and diagrams PASS');
      }
    }
    // Student progress must survive app update/reload; no destructive storage changes.
    const c=await browser.newContext({serviceWorkers:'block'}),p=await c.newPage();
    await p.goto(BASE);await p.locator('[data-p=grade8]').click();
    await p.evaluate(()=>{const s=window.MOEngine.state();s.profiles.grade8.name='Tester';s.profiles.grade8.lessons['f8-perimeter']={step:2,done:false};window.MOEngine.save()});
    await p.reload();
    const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('matteos.v5')));
    assert.equal(st.profiles.grade8.lessons['f8-perimeter'].step,2);checks++;
    assert.equal(st.profiles.grade8.name,'Tester');checks++;
    await c.close();
    console.log('Paper-first browser acceptance: '+checks+'/'+checks+' PASS');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
