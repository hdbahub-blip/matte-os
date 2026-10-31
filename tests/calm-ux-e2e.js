'use strict';
/* Calm UX acceptance: real browser navigation, grade parity and first-pass comprehension.
   Emulation only, physical Safari and real students remain a separate gate. */
const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
const BASE=process.argv[2]||'http://127.0.0.1:8765/';
(async()=>{
  const browser=await chromium.launch({headless:true});let n=0;
  try{
    for(const [deviceName,device] of [['small',devices['iPhone SE']],['mobile',devices['iPhone 13']],['desktop',{viewport:{width:1280,height:800}}]]){
      for(const [grade,sid] of [['grade8','f8-area'],['grade9','s9-powers']]){
        const context=await browser.newContext({...device,serviceWorkers:'block'}),page=await context.newPage();
        page.setDefaultTimeout(12000);
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.goto(BASE,{waitUntil:'networkidle'});
        assert.match(await page.locator('#main').innerText(),/Cup skickar tillfälliga speluppgifter/);n++;
        await page.locator('[data-p="'+grade+'"]').click();
        await page.waitForSelector('.calm-choices');
        for(const [route,text] of [['formler','Förstå matte'],['tabell/home','Öva multiplikation'],['cup','Spela tillsammans']]){
          const link=page.locator('.calm-choice[href="#/'+route+'"]');
          assert.equal(await link.count(),1,'Missing clear path '+route);n++;
          assert.match(await link.innerText(),new RegExp(text));n++;
        }
        assert.equal(await page.locator('.hero .btn').count(),1,'One primary recommendation on Home');n++;
        await page.goto(BASE+'#/l/'+sid+'/0');
        await page.waitForSelector('.paper-flow');
        assert.equal(await page.locator('.paper-step:visible').count(),3,'All three steps visible on first explanation');n++;
        assert.equal(await page.locator('.paper-answer:visible').count(),1,'Answer visible without extra click');n++;
        assert.equal(await page.locator('.focus .big-f:visible').count(),0,'No forced advanced formula');n++;
        await page.locator('[data-h="#/l/'+sid+'/2"]').click();
        await page.waitForSelector('.paper-known');
        assert.equal(await page.locator('.paper-known').count(),1,'Go directly to guided practice');n++;
        await page.goto(BASE+'#/formler');
        await page.waitForSelector('h1:has-text("Förstå matte")');
        assert.match(await page.locator('h1').first().innerText(),/Förstå matte/);n++;
        assert.equal(await page.locator('.fold summary').filter({hasText:'Utskrivbar formelaffisch'}).count(),1);n++;
        await page.goto(BASE+'#/trana');
        assert.equal(await page.locator('.calm-multiply a[href="#/tabell/home"]').count(),1);n++;
        assert.equal(await page.locator('.calm-multiply a[href="#/cup"]').count(),1);n++;
        await page.goto(BASE+'#/cup');
        await page.locator('#cup >> css=[data-v=host]').click();
        assert.equal(await page.locator('#cup >> css=[data-act=create]').count(),1);n++;
        assert.equal(await page.locator('#cup >> css=.cup-customize:not([open])').count(),1);n++;
        assert.match(await page.locator('#cup >> css=.card').first().innerText(),/30 sekunder per fråga/);n++;
        const widths=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);
        assert(widths[0]<=widths[1]+2,deviceName+' '+grade+' overflow '+widths);n++;
        assert.deepEqual(errors,[],deviceName+' '+grade+' errors');n++;
        await context.close();
      }
    }
    // Tabellarenan opt-in auto-next: advances only after a correct answer; a wrong answer keeps the correction visible.
    {
      const context=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block'}),page=await context.newPage();
      page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(BASE,{waitUntil:'networkidle'});await page.locator('[data-p="grade9"]').click();
      await page.goto(BASE+'#/tabell/table/7');
      const toggle=page.locator('#arena [data-act="autonext"]');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-pressed'),'true','Auto-next toggle not on');n++;
      await page.locator('#arena a[href="#/tabell/practice/7"]').click();
      const answerCurrent=async correct=>{
        const eq=await page.locator('#arena .equation').innerText();const [a,b]=eq.match(/\d+/g).map(Number);
        await page.locator('#arena #answer').fill(String(correct?a*b:a*b+1));await page.locator('#arena #answerform button').click();
      };
      const position=()=>page.locator('#arena .question-head span').nth(1).innerText();
      assert.equal(await position(),'1 / 10');n++;
      await answerCurrent(true);await page.waitForTimeout(2600);
      assert.equal(await position(),'2 / 10','Correct answer did not auto-advance');n++;
      await answerCurrent(false);await page.waitForTimeout(2600);
      assert.equal(await position(),'2 / 10','Wrong answer auto-advanced past the correction');n++;
      assert.match(await page.locator('#arena .feedback').innerText(),/Bra att du försökte[\s\S]*=/,'Correction not kept visible');n++;
      await page.locator('#arena [data-act="next"]').click();
      assert.equal(await position(),'3 / 10','Manual Next after a wrong answer failed');n++;
      assert.deepEqual(errors,[],'auto-next errors');n++;
      await context.close();
      const reduced=await browser.newContext({...devices['iPhone 13'],serviceWorkers:'block',reducedMotion:'reduce'}),rp=await reduced.newPage();
      await rp.goto(BASE,{waitUntil:'networkidle'});await rp.locator('[data-p="grade9"]').click();
      await rp.goto(BASE+'#/tabell/table/7');await rp.locator('#arena a[href="#/tabell/practice/7"]').waitFor();
      assert.equal(await rp.locator('#arena [data-act="autonext"]').count(),0,'Auto-next offered although it is disabled under reduced motion');n++;
      await reduced.close();
    }
    console.log('CALM UX browser acceptance '+n+'/'+n+' PASS');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
