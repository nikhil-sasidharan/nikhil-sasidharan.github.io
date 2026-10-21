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
    if (paused || !el.animate) return;
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

  // Distinct abstract mechanisms for inventory, production, beverage routes and ingredients.
  const drawings = [
    '<path class="flow-line" d="M5 70H55L100 30H175L220 70H305M55 70l45 40h75l45-40"/><g class="pulse"><rect x="90" y="20" width="20" height="20"/><rect x="165" y="20" width="20" height="20"/><rect x="90" y="100" width="20" height="20"/><rect x="165" y="100" width="20" height="20"/></g><circle cx="55" cy="70" r="6"/><circle cx="220" cy="70" r="6"/>',
    '<path d="M10 95h290M10 115h290M65 35h140v20H65zM125 55v25"/><g class="belt"><rect x="25" y="75" width="25" height="20"/><rect x="85" y="75" width="25" height="20"/><rect x="145" y="75" width="25" height="20"/><rect x="205" y="75" width="25" height="20"/></g><path class="flow-line" d="M15 105h285"/>',
    '<path d="M30 30h55v85H30zM42 15h31v15M115 30h55v85h-55zM127 15h31v15"/><path class="flow-line" d="M85 70h40m45 0h100v35h-65"/><circle cx="270" cy="70" r="8"/><circle class="pulse" cx="205" cy="105" r="8"/>',
    '<circle cx="100" cy="70" r="48"/><circle cx="100" cy="70" r="25"/><g class="rotor"><path d="M100 22v96M52 70h96M66 36l68 68M66 104l68-68"/></g><path class="flow-line" d="M148 70h140M5 70h47"/><path d="M220 50h45v40h-45z"/>',
    '<path d="M55 40h90l-12 45-28 20v20H95v-20L67 85z"/><g class="pulse"><circle cx="75" cy="20" r="2"/><circle cx="100" cy="10" r="3"/><circle cx="123" cy="26" r="2"/><circle cx="90" cy="29" r="2"/></g><path class="flow-line" d="M105 125h115V70h65"/><g class="rotor"><circle cx="100" cy="70" r="18"/><path d="M82 70h36M100 52v36"/></g>'
  ];
  const jobs = [...document.querySelectorAll('.job')];
  jobs.forEach((job,i) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 310 140'); svg.setAttribute('class','job-art');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1');
    svg.innerHTML = drawings[i % drawings.length]; job.querySelector('.job-header').append(svg);
  });
  const jobObserver = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('in-view',e.isIntersecting)),{rootMargin:'100px'});
  jobs.forEach(job => jobObserver.observe(job));
  let scrollPending = false;
  function updateSpreads(){
    jobs.forEach(job => { const box=job.getBoundingClientRect();job.style.setProperty('--read',Math.max(0,Math.min(1,(innerHeight-box.top)/(innerHeight*.8)))); });
    scrollPending=false;
  }
  addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateSpreads);}},{passive:true});updateSpreads();

  // Canvas particles morph between an ingredient cloud, mixer, conveyor and logistics routes.
  const canvas = document.querySelector('.industrial-flow');
  const ctx = canvas.getContext('2d');
  let width=1,height=1,visible=true,frame=0,last=0,time=0;
  const pointer = {x:-2000,y:-2000};
  const count = innerWidth < 700 ? 85 : 170;
  const points = Array.from({length:count},(_,i)=>({seed:i*2.399963,ratio:i/count,x:0,y:0}));
  function size(){
    const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(time);
  }
  function shape(mode,p,t){
    const {seed,ratio:r}=p;const cx=width*.54,cy=height*.46,scale=Math.min(width*.35,height*.38);
    if(mode===0) return [cx+Math.cos(seed+t*.08)*scale*(.3+r),cy+Math.sin(seed*1.7+t*.12)*scale*.8];
    if(mode===1){const a=seed+t*.18;const radius=scale*(.35+(p.ratio% .25)*2);return [cx+Math.cos(a)*radius,cy+Math.sin(a)*radius];}
    if(mode===2){const x=((r+t*.028)%1);return [width*.08+x*width*.84,cy+Math.sin(Math.floor(r*6))*scale*.18+(Math.floor(r*4)%2)*scale*.38];}
    const lane=Math.floor(r*5);const u=(r*5+t*.045)%1;return [width*.06+u*width*.88,cy+(lane-2)*scale*.27+Math.sin(u*Math.PI*2)*scale*.16];
  }
  function draw(t){
    ctx.clearRect(0,0,width,height);
    const cycle=t/7,mode=Math.floor(cycle)%4,next=(mode+1)%4;
    const mix=Math.max(0,Math.min(1,((cycle%1)-.62)/.38));const blend=mix*mix*(3-2*mix);
    points.forEach((p,i)=>{
      const a=shape(mode,p,t),b=shape(next,p,t);p.x=a[0]+(b[0]-a[0])*blend;p.y=a[1]+(b[1]-a[1])*blend;
      const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d>0&&d<100){p.x+=dx/d*(100-d)*.16;p.y+=dy/d*(100-d)*.16;}
      ctx.beginPath();ctx.arc(p.x,p.y,i%7===0?2:1,0,Math.PI*2);ctx.fillStyle=i%5===0?'#e9ae8799':'#a6ced95c';ctx.fill();
      if(i>0&&i%3===0){const prev=points[i-1];if(Math.hypot(p.x-prev.x,p.y-prev.y)<scaleLimit()){ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle='#9cd3c81a';ctx.lineWidth=.6;ctx.stroke();}}
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
  document.querySelector('.hero').addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();pointer.x=e.clientX-b.left;pointer.y=e.clientY-b.top;},{passive:true});
  document.querySelector('.hero').addEventListener('pointerleave',()=>{pointer.x=pointer.y=-2000;});
  size();start();
})();
