(() => {
  'use strict';
  const $=id=>document.getElementById(id),data=window.PLAY_THE_END_DATA;
  const worlds=new Map(data.regions.map(region=>[region.id,data.createDemo(region)]));
  let selected=data.regions[0],loading=false,loadedAt=0;
  const rows=new Map();
  function mode(world) {
    const count=Object.values(world.live).filter(Boolean).length;
    return count?count+'/3':'DÉMO';
  }
  function drawLocator() {
    const ctx=$('region-locator').getContext('2d');
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000000';ctx.fillRect(0,0,320,240);
    ctx.strokeStyle='#253b3b';ctx.lineWidth=1;
    for(let x=10;x<=310;x+=25){ctx.beginPath();ctx.moveTo(x,.5);ctx.lineTo(x,211);ctx.stroke();}
    for(let y=10;y<=210;y+=25){ctx.beginPath();ctx.moveTo(10,y+.5);ctx.lineTo(310,y+.5);ctx.stroke();}
    ctx.fillStyle='#91bbc0';ctx.font='10px monospace';ctx.fillText('WGS84 / 10 ZONES',10,230);
    for(const region of data.regions) {
      const x=Math.round(10+(region.lon+180)/360*300),y=Math.round(10+(90-region.lat)/180*200),active=region.id===selected.id;
      ctx.fillStyle=active?'#ffe86b':'#60cdd0';ctx.fillRect(x-2,y-2,5,5);
      if(active) {
        ctx.strokeStyle='#ffe86b';ctx.strokeRect(x-7.5,y-7.5,16,16);
        ctx.fillStyle='#000000';ctx.fillRect(10,12,150,22);
        ctx.fillStyle='#ffe86b';ctx.font='12px monospace';ctx.fillText(String(region.number).padStart(2,'0')+' / '+region.label,14,27);
      }
    }
  }
  function paint() {
    const world=worlds.get(selected.id);
    for(const region of data.regions) {
      const entry=rows.get(region.id),snapshot=worlds.get(region.id),score=data.tension(snapshot);
      entry.input.checked=region.id===selected.id;
      entry.score.textContent=score+'%';entry.score.dataset.level=score>=60?'high':score>=40?'medium':'normal';
      entry.source.textContent=loading?'...':mode(snapshot);entry.source.dataset.mode=mode(snapshot)==='DÉMO'?'demo':'live';
    }
    $('region-title').textContent=selected.name;
    $('region-area').textContent=selected.area+' · '+String(selected.number).padStart(2,'0')+' / 10';
    $('region-coordinates').textContent=Math.abs(selected.lat).toFixed(2)+'° '+(selected.lat>=0?'N':'S')+' / '+Math.abs(selected.lon).toFixed(2)+'° '+(selected.lon>=0?'E':'W');
    $('region-wind').textContent=Math.round(world.weather.speed)+' km/h';
    $('region-heat').textContent=Math.round(world.weather.temperature)+' °C';
    $('region-humidity').textContent=Math.round(world.weather.humidity)+' % humidité';
    $('region-air').textContent=Math.round(world.air.pm)+' µg/m³';
    $('region-quakes').textContent=String(world.quakes.length);
    $('region-weather-mode').textContent=world.live.weather?'MODÈLE / '+world.weather.time.slice(11,16)+' UTC':'DÉMO';
    $('region-air-mode').textContent=world.live.air?'MODÈLE CAMS':'DÉMO';
    $('region-quake-mode').textContent=(world.live.quakes?'USGS':'DÉMO')+' / 1 000 km';
    const naval=window.PLAY_THE_END_SHIPPING?.describe(world.shipping);
    $('region-naval-count').textContent=loading?'...':naval?.count || 'À raccorder';
    $('region-naval-date').textContent=naval?.detail || 'Pilote : Suez seulement';
    $('region-naval-count').title=naval?.title || '';
    $('region-naval-date').title=naval?.title || '';
    $('region-tension').textContent=data.tension(world)+' / 100';
    $('region-sync').textContent=loading?'ACTUALISATION...':mode(world)==='DÉMO'?'DÉMO / HORS LIGNE':'DATA '+mode(world);
    $('region-refresh').disabled=loading;$('region-play').disabled=loading;
    $('region-time').textContent=world.stamp==='DEMO'?'Valeurs de démonstration':world.stamp.slice(0,10)+' · '+world.stamp.slice(11,16)+' UTC';
    drawLocator();
  }
  async function refresh(force=false) {
    if(loading || (!force && loadedAt && Date.now()-loadedAt<600000))return;
    loading=true;paint();
    try {
      const snapshots=await data.loadRegions(undefined,force);
      for(const world of snapshots)worlds.set(world.regionId,world);
      loadedAt=Date.now();
    } finally {loading=false;paint();}
  }
  for(const region of data.regions) {
    const label=document.createElement('label');label.className='region-choice';
    const input=document.createElement('input');input.type='radio';input.name='region';input.value=region.id;input.setAttribute('aria-label',region.name);
    const number=document.createElement('span');number.className='region-number';number.textContent=String(region.number).padStart(2,'0');
    const name=document.createElement('span');name.className='region-name';name.textContent=region.name;
    const score=document.createElement('span');score.className='region-score';
    const source=document.createElement('span');source.className='region-source';
    label.append(input,number,name,score,source);$('region-list').append(label);rows.set(region.id,{input,score,source});
    input.addEventListener('change',()=>{if(input.checked){selected=region;paint();}});
  }
  $('region-refresh').addEventListener('click',()=>refresh(true));
  window.PLAY_THE_END_REGIONS=Object.freeze({open:()=>refresh(),selected:()=>selected,refresh});
  paint();
})();
