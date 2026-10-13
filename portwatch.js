(() => {
  'use strict';
  const SOURCE='https://services9.arcgis.com/weJ1QsnbMYJlCHdG/arcgis/rest/services/Daily_Chokepoints_Data/FeatureServer/0';
  const PILOT=Object.freeze({regionId:'suez',id:'chokepoint1',name:'Suez Canal'});
  const DAY=86400000,MAX_AGE_DAYS=7,MAX_PRESSURE=.08,CACHE_KEY='play-the-end-portwatch-suez-v1';
  let pending=null;
  const utcDay=now=>Math.floor(now/DAY)*DAY;
  function dateStamp(value) {
    if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))return NaN;
    const stamp=Date.parse(value+'T00:00:00Z');
    return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0,10)===value?stamp:NaN;
  }
  function empty(regionId,status='unavailable') {
    return Object.freeze({regionId,status,access:'none',date:null,containers:null,total:null,pressureBonus:0,source:SOURCE});
  }
  function parse(pack,now=Date.now(),access='network') {
    if(pack?.error || pack?.exceededTransferLimit || !Array.isArray(pack?.features) || !pack.features.length)return null;
    const days=new Map();
    for(const feature of pack.features) {
      const a=feature?.attributes,stamp=dateStamp(a?.date);
      if(!a || a.portid!==PILOT.id || a.portname!==PILOT.name || !Number.isFinite(stamp) || stamp>utcDay(now) ||
        ![a.n_container,a.n_total].every(n=>Number.isSafeInteger(n) && n>=0) || a.n_container>a.n_total)return null;
      const row=Object.freeze({date:a.date,containers:a.n_container,total:a.n_total});
      const old=days.get(stamp);
      if(old && (old.containers!==row.containers || old.total!==row.total))return null;
      days.set(stamp,row);
    }
    const latestStamp=Math.max(...days.keys()),latest=days.get(latestStamp),ageDays=Math.round((utcDay(now)-latestStamp)/DAY);
    const previous=Array.from({length:28},(_,i)=>days.get(latestStamp-(i+1)*DAY));
    const complete=previous.every(Boolean),baseline=complete?previous.reduce((sum,row)=>sum+row.containers,0)/28:null;
    // This is a capped game modifier, not a measured ecological impact or a forecast.
    const pressureBonus=ageDays<=MAX_AGE_DAYS && baseline>0?MAX_PRESSURE*Math.max(0,Math.min(1,latest.containers/baseline-1)):0;
    return Object.freeze({regionId:PILOT.regionId,status:ageDays<=MAX_AGE_DAYS?'recent':'stale',access,date:latest.date,
      containers:latest.containers,total:latest.total,ageDays,baseline,historyComplete:complete,pressureBonus,source:SOURCE});
  }
  function queryURL(now=Date.now()) {
    const day=utcDay(now),params=new URLSearchParams({where:"portid='"+PILOT.id+"' AND date>=DATE '"+new Date(day-45*DAY).toISOString().slice(0,10)+"' AND date<=DATE '"+new Date(day).toISOString().slice(0,10)+"'",
      outFields:'date,portid,portname,n_container,n_total',orderByFields:'date DESC',resultRecordCount:'60',returnGeometry:'false',f:'json'});
    return SOURCE+'/query?'+params;
  }
  function cache() {
    try {
      const stored=JSON.parse(window.localStorage.getItem(CACHE_KEY));
      return stored?.version===1 && Number.isFinite(stored.fetchedAt) && stored.fetchedAt<=Date.now()?stored:null;
    } catch {return null;}
  }
  function fallback(now) {
    const stored=cache(),known=window.PLAY_THE_END_PORTWATCH_SNAPSHOT;
    const candidates=[stored && parse(stored.pack,now,'cache'),known && parse(known.pack,now,'snapshot')].filter(Boolean);
    return candidates.sort((a,b)=>b.date.localeCompare(a.date))[0] || empty(PILOT.regionId);
  }
  async function request(force) {
    const now=Date.now(),stored=cache(),cached=stored && parse(stored.pack,now,'cache');
    if(!force && cached && now-stored.fetchedAt<3600000)return cached;
    const controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),6500);
    try {
      const response=await fetch(queryURL(now),{signal:controller.signal,credentials:'omit'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const pack=await response.json(),snapshot=parse(pack,Date.now(),'network');
      if(!snapshot)throw new Error('Invalid PortWatch observations');
      try {window.localStorage.setItem(CACHE_KEY,JSON.stringify({version:1,fetchedAt:Date.now(),pack}));}catch {}
      return snapshot;
    } catch {return fallback(Date.now());}
    finally {window.clearTimeout(timer);}
  }
  async function load(region,force=false) {
    const id=typeof region==='string'?region:region.id;
    if(id!==PILOT.regionId)return empty(id,'unmapped');
    if(!pending)pending=request(force).finally(()=>{pending=null;});
    return pending;
  }
  function describe(snapshot) {
    if(!snapshot || snapshot.status==='unmapped')return {count:'À raccorder',detail:'Pilote : Suez seulement',title:'Aucun comptage naval associé à cette région. Pression navale +0 point.'};
    if(snapshot.status==='unavailable')return {count:'Indisponible',detail:'PORTWATCH / +0 pt',title:'Pas de comptage valide disponible. Une donnée absente ne vaut pas zéro navire.'};
    const date=snapshot.date.split('-').reverse().join('/'),points=Math.round(snapshot.pressureBonus*1000)/10;
    const origin=snapshot.access==='network'?'':snapshot.access==='cache'?' / CACHE':' / LOCAL';
    const mode=snapshot.status==='stale'?'ANCIEN'+origin:snapshot.access==='network'?'RÉCENT':snapshot.access==='cache'?'CACHE':'COPIE LOCALE';
    return {count:snapshot.containers+' cont. / '+snapshot.total+' nav.',detail:date+' · '+mode+' · +'+points+' pt',
      title:'IMF PortWatch / canal de Suez. '+snapshot.containers+' porte-conteneurs et '+snapshot.total+' navires comptés le '+date+'. Accès : '+snapshot.access+'. '+
        (snapshot.status==='stale'?'Observation de plus de 7 jours : aucun effet. ':!snapshot.historyComplete?'Historique incomplet : aucun effet. ':'Comparaison aux 28 jours précédents. ')+
        'Modificateur de jeu plafonné à +8 points, sans déplacement des bateaux. Ce n’est ni une mesure de pollution ni une prévision de catastrophe.'};
  }
  window.PLAY_THE_END_SHIPPING=Object.freeze({load,parse,queryURL,describe,empty,maxAgeDays:MAX_AGE_DAYS,maxPressure:MAX_PRESSURE,pilot:PILOT});
})();
