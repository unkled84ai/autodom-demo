'use strict';
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Открыть меню')}
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню')});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
const dialog=document.querySelector('#booking'),form=document.querySelector('#booking-form'),result=document.querySelector('#form-result');
document.querySelectorAll('[data-book]').forEach(b=>b.addEventListener('click',()=>{form.reset();form.hidden=false;result.hidden=true;form.elements.service.value=b.dataset.book;dialog.showModal();document.body.style.overflow='hidden'}));
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow='';form.reset()});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
form.addEventListener('submit',e=>{e.preventDefault();form.hidden=true;result.hidden=false;form.reset()});
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');observer.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.reveal').forEach(e=>observer.observe(e));
// Keep useful fragments from the original one-page site.
function legacyHash(){const map={'#about':'#services','#features':'#approach','#map':'#contacts','#address':'#contacts','#ordr-beton-mdl2':'#roadside'};const hash=location.hash;if(map[hash]){history.replaceState(null,'',map[hash]);document.querySelector(map[hash]).scrollIntoView()}else if(hash==='#ordr-beton-mdl'||hash==='#ordr-beton-mdl3'){const button=hash==='#ordr-beton-mdl3'?document.querySelector('[data-book="Консультация специалиста"]'):document.querySelector('[data-book="Запись на ремонт"]');button.click()}}
window.addEventListener('hashchange',legacyHash);legacyHash();


// Two restrained perspective accents; no motion on touch or reduced-motion devices.
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
document.querySelectorAll('[data-tilt], .oil-art').forEach(el=>{
  let frame=0;
  const reset=()=>{cancelAnimationFrame(frame);el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y')};
  el.addEventListener('pointermove',e=>{
    if(reduced.matches||!finePointer.matches)return;
    const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{el.style.setProperty('--tilt-x',`${(-y*5).toFixed(2)}deg`);el.style.setProperty('--tilt-y',`${(x*6).toFixed(2)}deg`)});
  });
  el.addEventListener('pointerleave',reset);
  reduced.addEventListener('change',reset);
  finePointer.addEventListener('change',reset);
});
