(() => {
  'use strict';
  const screen=document.getElementById('crt-screen'),image=document.getElementById('crt-fractal'),frame=window.HOME_SCENE.crt;
  for(const key of ['width','height'])screen.style[key]=frame[key]+'px';
  screen.style.left=frame.x+'px';screen.style.top=frame.y+'px';
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    const src='../sprites-interface/fractal'+(motion.matches?'-static.png':'.gif')+'?v=wireframe-v11';
    if(image.getAttribute('src')!==src)image.setAttribute('src',src);
  }
  image.addEventListener('load',()=>{screen.hidden=false;});
  image.addEventListener('error',()=>{screen.hidden=true;});
  motion.addEventListener('change',update);
  update();
})();
