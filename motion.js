/* Decorative motion only: never rewrites professional content. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches;
  let userPaused = false;
  const running = new Set();
  const control = document.createElement('button');
  control.className = 'motion-toggle';
  control.type = 'button';
  function labelControl() {
    const de = document.documentElement.lang === 'de';
    control.textContent = paused ? '▶' : 'Ⅱ';
    const label = paused ? (de ? 'Animationen abspielen' : 'Play animations') : (de ? 'Animationen pausieren' : 'Pause animations');
    control.setAttribute('aria-label', label);
    control.title = label;
    control.setAttribute('aria-pressed', String(paused));
    document.documentElement.classList.toggle('motion-paused', paused);
  }
  control.addEventListener('click', () => { userPaused = !paused; paused = userPaused; syncMotion(); });
  document.body.append(control);
  new MutationObserver(labelControl).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  reduced.addEventListener('change', () => { paused = reduced.matches || userPaused; syncMotion(); });
  labelControl();
  function animate(el, frames, options) {
    if (paused || !el || !el.animate) return;
    const animation = el.animate(frames, options);
    running.add(animation);
    animation.finished.then(() => running.delete(animation)).catch(() => running.delete(animation));
  }
  const easing = 'cubic-bezier(.18,.75,.2,1)';
  // The opening is a non-blocking reveal; navigation and copy are immediately available.
  document.querySelectorAll('.hero .eyebrow,.hero h1,.hero .position,.hero .intro-copy,.hero .explore').forEach((el,i) => {
    animate(el,[{opacity:0,transform:'translateY(25px)',clipPath:'inset(0 0 100% 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0 0 0% 0)'}],{duration:950,delay:140+i*120,easing,fill:'backwards'});
  });
  animate(document.querySelector('.portrait-wrap'),[{opacity:0,transform:'translateY(35px) rotate(3deg)'},{opacity:1,transform:'translateY(0) rotate(0deg)'}],{duration:1200,delay:300,easing,fill:'backwards'});
  // Different section rhythms; text is never permanently hidden by CSS.
  const reveal = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => {
    if (!isIntersecting) return;
    reveal.unobserve(target);
    const kind = target.dataset.reveal;
    const frames = kind === 'line' ? [{clipPath:'inset(0 100% 0 0)'},{clipPath:'inset(0 0% 0 0)'}]
      : kind === 'spread' ? [{opacity:.15,transform:'translateX(-28px)'},{opacity:1,transform:'translateX(0)'}]
      : kind === 'rise' ? [{opacity:.15,transform:'translateY(38px)'},{opacity:1,transform:'translateY(0)'}]
      : [{opacity:.2,transform:'scale(.96)',transformOrigin:'left bottom'},{opacity:1,transform:'scale(1)'}];
    animate(target,frames,{duration:850,easing});
  }),{threshold:.12});
  const groups = {'.section h2':'rise','.expertise':'spread','.deck article':'rise','.practical-card':'spread','.qualification':'scale','.language-tile':'spread','.email':'line'};
  Object.entries(groups).forEach(([selector,kind]) => document.querySelectorAll(selector).forEach(el=>{el.dataset.reveal=kind;reveal.observe(el);}));

  // Canvas particles morph between an ingredient cloud, mixer, conveyor and logistics routes.
  const canvas = document.querySelector('.industrial-flow');
  const ctx = canvas.getContext('2d');
  let width=1,height=1,visible=true,frame=0,last=0,time=0;
  const pointer = {x:-2000,y:-2000};
  const count = innerWidth < 700 ? 260 : 520;
  const points = Array.from({length:count},(_,i)=>({seed:i*2.399963,ratio:i/count,x:0,y:0}));
  function size(){
    const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(time);
  }
  let sceneIndex=0, previousScene=0, transitionStart=0;
  const labels=[['Spices & ingredients','Gewürze & Zutaten'],['Mixing & production','Mischen & Produktion'],['Beverage supply chain','Getränke-Supply-Chain'],['Manufacturing flow','Produktionsfluss'],['Medical equipment supply chain','Medizintechnik-Supply-Chain']];
  const stage=document.querySelector('.hero-stage');
  const sceneLabel=document.getElementById('hero-scene-label');
  const prevButton=document.getElementById('hero-prev'),nextButton=document.getElementById('hero-next');
  function sceneLabels(){
    const de=document.documentElement.lang==='de';
    sceneLabel.textContent=labels[sceneIndex][de?1:0];
    document.getElementById('hero-scene-count').textContent=String(sceneIndex+1).padStart(2,'0')+' / 05';
    prevButton.setAttribute('aria-label',de?'Vorherige Visualisierung':'Previous visual');
    nextButton.setAttribute('aria-label',de?'Nächste Visualisierung':'Next visual');
  }
  function selectScene(delta){previousScene=sceneIndex;sceneIndex=(sceneIndex+delta+5)%5;transitionStart=time;stage.dataset.scene=sceneIndex;sceneLabels();if(paused)draw(time+2);}
  prevButton.addEventListener('click',()=>selectScene(-1));nextButton.addEventListener('click',()=>selectScene(1));
  new MutationObserver(sceneLabels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});sceneLabels();
  function shape(mode,p,t){
    const {seed,ratio:r}=p;const cx=width*.43,cy=height*.57,scale=Math.min(width*.42,height*.43);
    if(mode===0){const a=seed+t*.16,rad=scale*Math.sqrt(r);return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.72+Math.sin(seed*3+t)*7];}
    if(mode===1){const a=r*Math.PI*10+t*.19;const teeth=1+Math.sin(a*16)*.07;const ring=Math.floor(r*3);const rad=scale*(.43+ring*.25)*teeth;return [cx+Math.cos(a)*rad,cy+Math.sin(a)*rad];}
    if(mode===2){const lane=Math.floor(r*7),u=(r*7+t*.018)%1;return [cx-scale+u*scale*2,cy+(lane-3)*scale*.17+Math.sin(u*Math.PI*3+t*.5)*scale*.18];}
    if(mode===3){const group=Math.floor(r*10),u=(r*10+t*.025)%1;const a=u*4;const x=a<1?a:a<2?1:a<3?3-a:0;const y=a<1?0:a<2?a-1:a<3?1:4-a;return [cx-scale+(group%5)*scale*.4+x*scale*.28,cy+(Math.floor(group/5)-1)*scale*.7+y*scale*.4];}
    const arm=Math.floor(r*4),u=(r*4+t*.013)%1;const a=arm*Math.PI/2;const along=(u-.5)*scale*1.9,across=Math.sin(seed)*scale*.18;return [cx+Math.cos(a)*along-Math.sin(a)*across,cy+Math.sin(a)*along+Math.cos(a)*across];
  }
  function draw(t){
    ctx.clearRect(0,0,width,height);
    const mode=previousScene,next=sceneIndex;
    const mix=Math.max(0,Math.min(1,(t-transitionStart)/1.2));const blend=mix*mix*(3-2*mix);
    points.forEach((p,i)=>{
      const a=shape(mode,p,t),b=shape(next,p,t);p.x=a[0]+(b[0]-a[0])*blend;p.y=a[1]+(b[1]-a[1])*blend;
      const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d>0&&d<100){p.x+=dx/d*(100-d)*.16;p.y+=dy/d*(100-d)*.16;}
      ctx.beginPath();ctx.arc(p.x,p.y,i%7===0?2.3:1.3,0,Math.PI*2);ctx.fillStyle=i%5===0?'#e9ae87d9':'#a6ced9b0';ctx.fill();
      if(i>0&&i%3===0){const prev=points[i-1];if(Math.hypot(p.x-prev.x,p.y-prev.y)<scaleLimit()){ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#9cd3c829';ctx.lineWidth=.6;ctx.stroke();}}
    });
  }
  function scaleLimit(){return Math.min(width*.25,180);}
  function tick(stamp){
    frame=0;if(paused||!visible||document.hidden)return;
    if(stamp-last>=32){time+=Math.min((stamp-last)/1000,.05);last=stamp;draw(time);}
    frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}}
  function syncMotion(){labelControl();if(paused){cancelAnimationFrame(frame);frame=0;running.forEach(a=>a.cancel());running.clear();}else start();}
  new ResizeObserver(size).observe(canvas);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
  stage.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();pointer.x=e.clientX-b.left;pointer.y=e.clientY-b.top;},{passive:true});
  stage.addEventListener('pointerleave',()=>{pointer.x=pointer.y=-2000;});
  size();start();
})();
