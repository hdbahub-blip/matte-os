/* Matte OS · keeps the browser/PWA status bar aligned with selected pupil and appearance. */
(function(){
  'use strict';
  const meta=document.querySelector('meta[name="theme-color"]');
  if(!meta)return;
  function sync(){
    const value=getComputedStyle(document.documentElement).getPropertyValue('--ui-canvas').trim();
    if(/^#[0-9a-fA-F]{6}$/.test(value))meta.setAttribute('content',value);
  }
  const observer=new MutationObserver(sync);
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-mode','data-theme','data-profile','data-exam-grade']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});
  else sync();
})();
