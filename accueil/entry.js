(() => {
  'use strict';
  if(new URLSearchParams(window.location.search).get('play')==='1')return;
  document.documentElement.dataset.entry='home';
  window.location.replace(new URL('proposition.html',document.currentScript.src).href);
})();
