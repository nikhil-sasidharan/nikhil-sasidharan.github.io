/* Run with Playwright available and ORIGINAL_PORTFOLIO pointing to an original checkout. */
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ? process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright' : 'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];const results=[];
 async function open(url,width=1440,reducedMotion='no-preference'){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion});
  page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForTimeout(1600);return page;
 }
 const original=await open('file://'+path.resolve(process.env.ORIGINAL_PORTFOLIO||'/tmp/portfolio-original','index.html'));
 const updated=await open('http://localhost:8765/');
 const snapshot=page=>page.evaluate(()=>{
  const main=document.querySelector('main').cloneNode(true);
  main.querySelectorAll('canvas,svg,i,[aria-hidden="true"]').forEach(e=>e.remove());
  return {text:main.textContent.replace(/\s+/g,' ').trim(),translations:[...document.querySelectorAll('[data-de]')].map(e=>e.dataset.de),links:[...document.querySelectorAll('a')].map(a=>[a.getAttribute('href'),a.getAttribute('download')]),images:[...document.images].map(i=>[i.getAttribute('src'),i.alt])};
 });
 for(const lang of ['en','de','en']){
  await original.locator('[data-lang='+lang+']').click();await updated.locator('[data-lang='+lang+']').click();
  for(let job=0;job<5;job++){
   await original.locator('[data-job="'+job+'"]').click();await updated.locator('[data-job="'+job+'"]').click();
   assert.deepEqual(await snapshot(updated),await snapshot(original),'Content mismatch: '+lang+' chapter '+job);
  }
  results.push('Exact original content, translations, links, photograph: '+lang+' (all 5 chapters)');
 }
 await updated.locator('[data-job="0"]').click();
 for(const width of [1440,1024,768,390,320]){
  await updated.setViewportSize({width,height:900});
  for(const lang of ['en','de']){
   await updated.locator('[data-lang='+lang+']').click();
   assert(await updated.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+width+' '+lang);
   for(const section of ['home','ns-chapters','about','experience','skills','projects','education','contact']){
    await updated.locator('#'+section).scrollIntoViewIfNeeded();
    assert(await updated.locator('#'+section).isVisible());
   }
  }
  results.push('No page overflow and all sections visible at '+width+'px in EN/DE');
 }
 await updated.setViewportSize({width:1440,height:1000});await updated.locator('[data-lang=en]').click();await updated.evaluate(()=>scrollTo(0,0));await updated.waitForTimeout(500);
 await updated.screenshot({path:'/tmp/industrial-desktop.png'});
 for(const section of ['about','experience','skills','projects','education','contact']){
  await updated.locator('#'+section).scrollIntoViewIfNeeded();await updated.waitForTimeout(900);await updated.screenshot({path:'/tmp/industrial-'+section+'.png'});
 }
 await updated.setViewportSize({width:390,height:844});await updated.evaluate(()=>scrollTo(0,0));await updated.screenshot({path:'/tmp/industrial-mobile.png'});
 for(const link of await updated.locator('.main-nav a').all()){
  const href=await link.getAttribute('href');await link.click();await updated.waitForTimeout(350);assert.equal(new URL(updated.url()).hash,href);
 }
 assert.equal(await updated.locator('.job details[open]').count(),5);
 await updated.locator('.job summary').first().click();assert.equal(await updated.locator('.job details[open]').count(),4);await updated.locator('.job summary').first().click();
 await updated.locator('.motion-toggle').click();assert.equal(await updated.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
 results.push('Navigation anchors, five open responsibility panels, pause control: passed');
 const reduced=await open('http://localhost:8765/',390,'reduce');
 assert.equal(await reduced.locator('.motion-toggle').getAttribute('aria-pressed'),'true');
 assert.equal(await reduced.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 results.push('Reduced motion starts paused with native scrolling');
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto('http://localhost:8765');assert.equal(await nojs.locator('.job').count(),5);assert(await nojs.locator('h1').isVisible());results.push('No-JavaScript fallback: content and responsibilities visible');
 assert.deepEqual(errors,[]);results.push('Zero JavaScript runtime errors');
 console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
