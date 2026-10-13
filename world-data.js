(() => {
  'use strict';
  const REGIONS = [
    {id:'borneo',name:'Bornéo',label:'BORNEO',lat:.6,lon:116.6,area:'Indonésie / Malaisie',demo:[31,61,24,75,.6,21]},
    {id:'malacca',name:'Détroit de Malacca',label:'MALACCA',lat:1.3,lon:103.8,area:'Singapour / Malaisie',demo:[32,75,18,120,1.2,28]},
    {id:'suez',name:'Canal de Suez',label:'SUEZ',lat:30,lon:32.55,area:'Égypte / mer Rouge',demo:[35,35,30,340,0,36]},
    {id:'panama',name:'Canal de Panama',label:'PANAMA',lat:9.1,lon:-79.7,area:'Panama',demo:[30,70,22,45,.8,12]},
    {id:'hormuz',name:'Détroit d’Ormuz',label:'HORMUZ',lat:26.6,lon:56.25,area:'Golfe Persique',demo:[38,45,26,250,0,43]},
    {id:'bengal',name:'Golfe du Bengale',label:'BENGAL',lat:22.3,lon:91.8,area:'Bangladesh / Inde',demo:[33,78,39,150,3,48]},
    {id:'pearl',name:'Delta de la rivière des Perles',label:'PEARL DELTA',lat:22.6,lon:113.8,area:'Chine / mer de Chine',demo:[32,65,28,80,1.5,38]},
    {id:'mediterranean',name:'Méditerranée',label:'MEDITERRANEAN',lat:37.5,lon:15.1,area:'Sicile / Méditerranée centrale',demo:[34,38,30,310,.1,24]},
    {id:'mississippi',name:'Delta du Mississippi',label:'MISSISSIPPI',lat:29.8,lon:-90.05,area:'Louisiane / golfe du Mexique',demo:[32,68,35,170,2.2,19]},
    {id:'north-sea',name:'Mer du Nord',label:'NORTH SEA',lat:51.95,lon:4.1,area:'Rotterdam / mer du Nord',demo:[20,73,41,270,1.1,15]}
  ].map((region,index)=>Object.freeze({...region,number:index+1}));
  const clamp=value=>Math.max(0,Math.min(1,value));
  const finite=value=>typeof value==='number' && Number.isFinite(value);
  function regionFor(id) {return REGIONS.find(region=>region.id===id) || REGIONS[0];}
  function createDemo(region=REGIONS[0]) {
    const [temperature,humidity,speed,direction,rain,pm]=region.demo;
    return {regionId:region.id,weather:{temperature,humidity,speed,direction,rain,time:'DEMO'},air:{pm,time:'DEMO'},
      quakes:[{id:'demo-'+region.id,mag:4.8,lon:region.lon+1,lat:region.lat-.5,depth:24,time:1}],
      live:{weather:false,air:false,quakes:false},stamp:'DEMO',seed:region.id+'|demo-v7'};
  }
  function pressure(world,strain=0) {
    const w=world.weather;
    const naval=world.shipping?.status==='recent' && finite(world.shipping.pressureBonus)?Math.max(0,Math.min(.08,world.shipping.pressureBonus)):0;
    return clamp(.2+.22*clamp(world.air.pm/60)+.16*clamp((100-w.humidity)/80)+.12*clamp((w.temperature-22)/18)+naval+strain/55);
  }
  function tension(world) {
    const seismic=world.quakes.length?clamp((Math.max(...world.quakes.map(q=>q.mag))-2.5)/5):0;
    return Math.round(100*clamp(.46*pressure(world)+.31*clamp(world.weather.speed/55)+.23*seismic));
  }
  function distanceKm(lat1,lon1,lat2,lon2) {
    const rad=Math.PI/180,a=Math.sin((lat2-lat1)*rad/2)**2+Math.cos(lat1*rad)*Math.cos(lat2*rad)*Math.sin((lon2-lon1)*rad/2)**2;
    return 6371*2*Math.asin(Math.sqrt(clamp(a)));
  }
  async function getJSON(url) {
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),6500);
    try {
      const response=await fetch(url,{signal:controller.signal});
      if(!response.ok)throw new Error('HTTP '+response.status);
      return await response.json();
    } finally {window.clearTimeout(timeout);}
  }
  function urls(regions) {
    const coordinates='latitude='+regions.map(r=>r.lat).join(',')+'&longitude='+regions.map(r=>r.lon).join(',');
    return [
      'https://api.open-meteo.com/v1/forecast?'+coordinates+'&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=UTC&forecast_days=1',
      'https://air-quality-api.open-meteo.com/v1/air-quality?'+coordinates+'&current=pm2_5&timezone=UTC&forecast_days=1',
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson'
    ];
  }
  function currentAt(pack,index,count) {
    if(pack.status!=='fulfilled')return null;
    const result=pack.value;
    if(Array.isArray(result))return result.length===count?result[index]?.current:null;
    return count===1?result?.current:null;
  }
  function recent(time,now) {
    const stamp=typeof time==='string'?Date.parse(/(?:Z|[+-]\d\d:\d\d)$/.test(time)?time:time+'Z'):NaN;
    return Number.isFinite(stamp) && stamp<=now+2*3600000 && stamp>=now-24*3600000;
  }
  function parseWorld(region,weather,air,quakePack,stamp) {
    const world=createDemo(region),now=Date.parse(stamp);
    world.stamp=stamp;
    if(weather && recent(weather.time,now) && ['temperature_2m','relative_humidity_2m','precipitation','wind_speed_10m','wind_direction_10m'].every(k=>finite(weather[k])) &&
      weather.relative_humidity_2m>=0 && weather.relative_humidity_2m<=100 && weather.wind_speed_10m>=0 && weather.precipitation>=0 && weather.wind_direction_10m>=0 && weather.wind_direction_10m<=360) {
      world.weather={speed:weather.wind_speed_10m,direction:weather.wind_direction_10m,temperature:weather.temperature_2m,humidity:weather.relative_humidity_2m,rain:weather.precipitation,time:weather.time};
      world.live.weather=true;
    }
    if(air && recent(air.time,now) && finite(air.pm2_5) && air.pm2_5>=0) {
      world.air={pm:air.pm2_5,time:air.time};world.live.air=true;
    }
    const features=quakePack.status==='fulfilled'?quakePack.value?.features:null;
    if(Array.isArray(features)) {
      // An empty, valid regional catalog means no events; never add fake live quakes.
      world.quakes=features.map(feature=>{
        const p=feature.properties||{},c=feature.geometry?.coordinates;
        if(!Array.isArray(c) || feature.geometry?.type!=='Point' || !feature.id)return null;
        return {id:String(feature.id),mag:p.mag,lon:c[0],lat:c[1],depth:c[2],time:p.time};
      }).filter(q=>q && [q.mag,q.lon,q.lat,q.depth,q.time].every(finite) && q.mag>=2.5 && Math.abs(q.lat)<=90 && Math.abs(q.lon)<=180 &&
        q.time>=now-86400000 && q.time<=now && distanceKm(region.lat,region.lon,q.lat,q.lon)<=1000);
      world.live.quakes=true;
    }
    world.seed=[region.id,stamp.slice(0,10),world.weather.speed,world.weather.direction,world.weather.humidity,world.air.pm,...world.quakes.slice(0,8).map(q=>q.id)].join('|');
    return world;
  }
  async function loadRegions(regions=REGIONS,force=false) {
    const naval=window.PLAY_THE_END_SHIPPING;
    const ships=naval?Promise.all(regions.map(region=>naval.load(region,force).catch(()=>naval.empty(region.id)))):null;
    const packs=await Promise.allSettled(urls(regions).map(getJSON)),stamp=new Date().toISOString();
    const shipping=ships?await ships:null;
    return regions.map((region,index)=>{
      const world=parseWorld(region,currentAt(packs[0],index,regions.length),currentAt(packs[1],index,regions.length),packs[2],stamp);
      if(shipping)world.shipping=shipping[index];
      return world;
    });
  }
  async function loadWorld(region=REGIONS[0]) {return (await loadRegions([region]))[0];}
  window.PLAY_THE_END_DATA=Object.freeze({regions:REGIONS,regionFor,createDemo,pressure,tension,distanceKm,urls,parseWorld,loadWorld,loadRegions});
})();
