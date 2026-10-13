(() => {
  'use strict';
  if(window.parent===window || !window.parent || new URLSearchParams(window.location.search).get('shell')!=='1')return;
  const CHANNEL='play-the-end-session', listeners=[];
  let state={enabled:true,volume:.25,paused:true,started:false,error:false};
  window.PLAY_THE_END_HOST={
    get state(){return state;},
    send(command,value){window.parent.postMessage({channel:CHANNEL,type:'command',command,value},'*');},
    subscribe(listener){listeners.push(listener);listener(state);}
  };
  window.addEventListener('message',event=>{
    if(event.source!==window.parent || event.data?.channel!==CHANNEL || event.data.type!=='music-state')return;
    const next=event.data.state;
    if(!next || !Number.isFinite(next.volume) || !['enabled','paused','started','error'].every(key=>typeof next[key]==='boolean'))return;
    state={...next,volume:Math.max(0,Math.min(1,next.volume))};
    for(const listener of listeners)listener(state);
  });
})();
