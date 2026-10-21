const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});const errors=[];const report=[];
 fs.mkdirSync('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 page.on('pageerror',e=>errors.push(e.message));
 // Fonts are decorative. Test with bundled fallbacks when the runner cannot reach Google.
 await page.goto('http://127.0.0.1:8765/');
 await page.waitForTimeout(1300);
 assert.equal(await page.locator('.chapters').count(),0);assert.equal(await page.locator('#about').count(),0);
 assert.equal(await page.locator('.compact-job').count(),5);assert.equal(await page.locator('.job details').count(),0);
 for(let i=0;i<5;i++){assert.equal(await page.locator('#hero-scene-count').textContent(),String(i+1).padStart(2,'0')+' / 05');await page.locator('#hero-next').click();}
 assert.equal(await page.locator('#hero-scene-count').textContent(),'01 / 05');
 await page.locator('#hero-prev').click();assert.equal(await page.locator('#hero-scene-count').textContent(),'05 / 05');
 await page.locator('#hero-next').click();
 report.push('All five hero scenes, next/previous and wrapping passed');
 for(const width of [1440,1024,768,390,320]){
  await page.setViewportSize({width,height:900});
  for(const route of ['/','/cv/']){
   await page.goto('http://127.0.0.1:8765'+route);
   for(const lang of ['en','de']){
    await page.locator('[data-lang='+lang+']').click();
    assert.equal(await page.locator('html').getAttribute('lang'),lang);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width+' '+route+' '+lang);
    const badLinks=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute('href')).filter(h=>h.length>1&&!document.getElementById(h.slice(1))));assert.deepEqual(badLinks,[]);
    if(width===1440||width===390){await page.waitForTimeout(1000);await page.screenshot({path:'test-results/'+(route==='/'?'home':'resume')+'-'+width+'-'+lang+'.png',fullPage:true});}
   }
  }
  report.push('EN/DE, anchors and no overflow: '+width+'px, both pages');
 }
 await page.goto('http://127.0.0.1:8765/cv/');assert.equal(await page.locator('.job details[open]').count(),5);assert.equal(await page.locator('.job details li').count(),21);
 const roles=await page.locator('.job .company').allTextContents();assert.equal(roles.length,5);
 await page.locator('[data-lang=de]').click();assert.equal(await page.title(),'Nikhil Sasidharan | Lebenslauf');
 await page.emulateMedia({media:'print'});assert.equal(await page.locator('.print-cv').isVisible(),false);await page.emulateMedia({media:'screen'});
 const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:8765/');
 assert.equal(await reduced.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
 assert.equal(await reduced.locator('.neon-dot').evaluate(e=>getComputedStyle(e).animationName),'none');
 await reduced.locator('#hero-next').click();assert.equal(await reduced.locator('#hero-scene-count').textContent(),'02 / 05');
 await reduced.locator('[data-lang=de]').click();assert.equal(await reduced.locator('#hero-scene-label').textContent(),'Mischen & Produktion');
 report.push('Reduced motion: static status, paused animation and working scene controls');
 const nojs=await browser.newPage({javaScriptEnabled:false});await nojs.goto('http://127.0.0.1:8765/cv/');assert.equal(await nojs.locator('.job details[open]').count(),5);report.push('Résumé details readable without JavaScript');
 assert.deepEqual(errors,[]);report.push('No JavaScript errors');fs.writeFileSync('test-results/report.json',JSON.stringify(report,null,2));console.log(report.join('\n'));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
