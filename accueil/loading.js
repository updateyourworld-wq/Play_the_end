(() => {
  'use strict';
  const root=document.documentElement,home=document.getElementById('home-viewport'),screen=document.getElementById('boot-screen');
  if(root.dataset.bootLoading!=='true')return;
  const cleanups=[],started=performance.now();
  let finished=false;
  home.inert=true;
  home.setAttribute('aria-busy','true');
  function fit(){root.style.setProperty('--boot-scale',String(Math.min(innerWidth/1536,innerHeight/864)));}
  function finish(){
    if(finished)return;
    finished=true;
    cleanups.forEach(cleanup=>cleanup());
    window.clearTimeout(window.PLAY_THE_END_BOOT_TIMEOUT);
    window.clearTimeout(watchdog);
    delete window.PLAY_THE_END_BOOT_TIMEOUT;
    window.removeEventListener('resize',fit);
    delete root.dataset.bootLoading;
    screen.hidden=true;
    screen.setAttribute('aria-busy','false');
    home.inert=false;
    home.setAttribute('aria-busy','false');
  }
  function imageReady(image){
    if(!image)return Promise.resolve();
    return new Promise(resolve=>{
      let settled=false;
      function cleanup(){image.removeEventListener('load',loaded);image.removeEventListener('error',failed);}
      function done(){if(settled)return;settled=true;cleanup();resolve();}
      function loaded(){
        if(settled)return;
        cleanup();
        if(image.decode && image.naturalWidth>0)Promise.resolve().then(()=>image.decode()).catch(()=>{}).then(done);
        else done();
      }
      function failed(){done();}
      cleanups.push(cleanup);
      image.addEventListener('load',loaded,{once:true});
      image.addEventListener('error',failed,{once:true});
      if(image.complete)loaded();
    });
  }
  // Only visible home assets are awaited; the bonus pages and music are not a loading gate.
  const assets=['boot-logo','boot-loading','home-room','home-brand-logo','creator-logo','distributor-logo','crt-fractal'].map(id=>imageReady(document.getElementById(id)));
  if(document.fonts?.load)assets.push(Promise.resolve().then(()=>document.fonts.load('24px VT323')).catch(()=>{}));
  const watchdog=window.setTimeout(finish,10000);
  window.addEventListener('resize',fit);
  fit();
  const painted=new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  Promise.all([...assets,painted]).then(()=>{
    if(finished)return;
    const hold=window.setTimeout(finish,Math.max(0,650-(performance.now()-started)));
    cleanups.push(()=>window.clearTimeout(hold));
  }).catch(finish);
})();
