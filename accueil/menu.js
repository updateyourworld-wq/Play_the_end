(() => {
  'use strict';
  const $=id=>document.getElementById(id), scene=window.HOME_SCENE;
  const panels=['regions','options','bonus','credits'];
  const MENU_TRACKS=['../audio/break-beat-90s.mp3','../audio/hazy-breakbeat.mp3'];
  let view='menu', opener=null, wantsMusic=false, waitingForGesture=false, attempt=0, pendingRequest=null, hasPlayed=false, playingGame=false;
  const music=$('menu-music'), gameFrame=$('game-frame');
  const CHANNEL='play-the-end-session';
  function publishMusic() {
    if(!playingGame)return;
    // Local file documents can have opaque origins; validate the window on receipt.
    gameFrame.contentWindow.postMessage({channel:CHANNEL,type:'music-state',state:{enabled:wantsMusic,volume:music.volume,paused:music.paused,started:hasPlayed,error:!$('audio-error').hidden}},'*');
  }
  function chooseMenuTrack(random=Math.random) {
    return MENU_TRACKS[Math.floor(random()*MENU_TRACKS.length)];
  }
  function fitStage(width=window.innerWidth,height=window.innerHeight) {
    $('stage').style.setProperty('--stage-scale',String(Math.max(0,Math.min(width/scene.width,height/scene.height))));
  }
  for(const [key,id] of [['poster','poster'],['brand','brand'],['menu','main-menu'],['creator','creator-logo'],['distributor','distributor-logo']]) {
    const frame=scene[key], element=$(id);
    element.style.left=frame.x+'px'; element.style.top=frame.y+'px';
    element.style.width=frame.width+'px'; element.style.height=frame.height+'px';
    element.style.setProperty('--angle',(frame.angle||0)+'deg');
  }
  function showPanel(next,origin=null) {
    view=next;
    if(origin) opener=origin;
    $('main-menu').hidden=next!=='menu';
    for(const name of panels) $('panel-'+name).hidden=name!==next;
    if(next==='menu') {if(opener)opener.focus();}
    else $(next+'-title').focus();
  }
  async function setMusic(enabled,automatic=false) {
    if(document.visibilityState==='hidden')enabled=false;
    wantsMusic=enabled;
    waitingForGesture=false;
    const request=++attempt;
    $('music-enabled').checked=enabled;
    $('audio-error').hidden=true;
    if(!enabled) {pendingRequest=null;music.pause();publishMusic();return;}
    pendingRequest=request;
    try {
      await music.play();
      hasPlayed=true;
      if(!wantsMusic || document.visibilityState==='hidden')music.pause();
    } catch(error) {
      if(request===attempt) {
        if(automatic && error.name==='NotAllowedError') waitingForGesture=true;
        else {wantsMusic=false; $('music-enabled').checked=false; $('audio-error').hidden=false;}
      }
    } finally {if(pendingRequest===request)pendingRequest=null;publishMusic();}
  }
  function resumeMusic(event) {
    if(!waitingForGesture || !wantsMusic || document.visibilityState==='hidden')return;
    if(event.type==='keydown' && !['Enter',' '].includes(event.key))return;
    if(event.target?.closest?.('#start,#music-enabled'))return;
    return setMusic(true);
  }
  function setVolume(value) {
    const volume=Math.max(0,Math.min(100,Number(value)));
    music.volume=volume/100;
    $('volume').value=String(volume);
    $('volume-value').textContent=volume+' %';
    publishMusic();
  }
  function startGame(event) {
    if(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button!==undefined && event.button!==0))return;
    event.preventDefault();
    showPanel('regions',$('start'));
    window.PLAY_THE_END_REGIONS.open();
    if(wantsMusic && music.paused)return setMusic(true);
  }
  function launchGame() {
    if(playingGame || $('region-play').disabled)return;
    const url=new URL($('start').href,window.location.href);
    url.searchParams.set('shell','1');
    url.searchParams.set('region',window.PLAY_THE_END_REGIONS.selected().id);
    playingGame=true;
    gameFrame.src=url.href;
    $('home-viewport').hidden=true;
    gameFrame.hidden=false;
    if(wantsMusic && music.paused)return setMusic(true);
  }
  function returnToMenu() {
    playingGame=false;
    gameFrame.hidden=true;
    gameFrame.src='about:blank';
    $('home-viewport').hidden=false;
    showPanel('menu');
    $('start').focus();
  }
  function gameCommand(event) {
    if(!playingGame || event.source!==gameFrame.contentWindow || event.data?.channel!==CHANNEL || event.data.type!=='command')return;
    const {command,value}=event.data;
    if(command==='ready')publishMusic();
    else if(command==='home')returnToMenu();
    else if(command==='play') {if(wantsMusic && music.paused && music.volume>0)return setMusic(true);else publishMusic();}
    else if(command==='toggle') {
      if(wantsMusic && music.volume>0 && (!music.paused || pendingRequest!==null)) return setMusic(false);
      if(music.volume===0)setVolume(25);
      return setMusic(true);
    } else if(command==='volume' && Number.isFinite(value)) {
      setVolume(value);
      if(wantsMusic && music.paused && music.volume>0)return setMusic(true);
    }
  }
  for(const button of document.querySelectorAll('[data-panel]')) button.addEventListener('click',()=>showPanel(button.dataset.panel,button));
  for(const button of document.querySelectorAll('.back')) button.addEventListener('click',()=>showPanel('menu'));
  $('poster').addEventListener('click',()=>{window.BONUS_READER?.select('poster');showPanel('bonus',$('poster'));});
  $('music-enabled').addEventListener('change',event=>setMusic(event.target.checked));
  $('volume').addEventListener('input',event=>setVolume(event.target.value));
  $('start').addEventListener('click',startGame);
  $('region-play').addEventListener('click',launchGame);
  gameFrame.addEventListener('load',()=>{if(playingGame){gameFrame.focus();publishMusic();}});
  window.addEventListener('message',gameCommand);
  for(const name of ['playing','pause','volumechange']) music.addEventListener(name,publishMusic);
  music.addEventListener('error',()=>{$('audio-error').hidden=false;publishMusic();});
  document.addEventListener('click',resumeMusic);
  document.addEventListener('keydown',resumeMusic);
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && view!=='menu'){event.preventDefault();showPanel('menu');}});
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden') {waitingForGesture=false;music.pause();publishMusic();}
    else if(wantsMusic && music.paused)setMusic(true,true);
  });
  window.addEventListener('pagehide',()=>setMusic(false));
  window.addEventListener('resize',()=>fitStage());
  fitStage(); setVolume($('volume').value);
  music.src=chooseMenuTrack();
  setMusic(true,true);
})();
