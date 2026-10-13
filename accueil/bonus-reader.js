(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const spreads=[[1],[2,3],[4,5],[6,7],[8,9],[10,11],[12]];
  let selection='poster',spread=0,zoom=false;
  const file=page=>'fanzine-wildiyzney/page-'+String(page).padStart(2,'0')+'.png';
  function showSpread(next) {
    spread=Math.max(0,Math.min(spreads.length-1,Number(next)||0));
    const pages=spreads[spread];
    $('book-error').hidden=true;
    for(const [i,side] of ['left','right'].entries()) {
      $('book-page-'+side).hidden=pages[i]===undefined;
      if(pages[i]!==undefined) {
        $('book-image-'+side).src=file(pages[i]);
        $('book-image-'+side).alt='WILDIYZNEY WORLD : page '+pages[i];
      }
    }
    $('book-spread').value=String(spread);
    $('book-prev').disabled=spread===0;
    $('book-next').disabled=spread===spreads.length-1;
    $('book-caption').textContent=(spread===0?'Couverture':spread===6?'Dos de couverture':'Pages '+pages.join('-'))+' / 12 pages';
    $('book-viewport').scrollTop=0;$('book-viewport').scrollLeft=0;
    if(selection==='fanzine')$('bonus-download').href=file(pages[0]);
  }
  function select(next,focus=false) {
    selection=next==='fanzine'?'fanzine':'poster';
    const book=selection==='fanzine';
    $('bonus-view').hidden=book;$('fanzine-reader').hidden=!book;
    for(const name of ['poster','fanzine']) {
      $('tab-'+name).setAttribute('aria-selected',String(selection===name));
      $('tab-'+name).tabIndex=selection===name?0:-1;
    }
    $('bonus-download').href=book?file(spreads[spread][0]):'poster-join-the-tribe-original.jpg';
    const label=book?'Télécharger la page PNG':'Télécharger l\'original';
    $('bonus-download').title=label;$('bonus-download').setAttribute('aria-label',label);
    if(focus)$('tab-'+selection).focus();
  }
  for(const name of ['poster','fanzine']) {
    $('tab-'+name).addEventListener('click',()=>select(name));
    $('tab-'+name).addEventListener('keydown',event=>{
      if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
        event.preventDefault();select(event.key==='Home'?'poster':event.key==='End'?'fanzine':name==='poster'?'fanzine':'poster',true);
      }
    });
  }
  $('book-prev').addEventListener('click',()=>showSpread(spread-1));
  $('book-next').addEventListener('click',()=>showSpread(spread+1));
  $('book-spread').addEventListener('change',event=>showSpread(event.target.value));
  $('book-zoom').addEventListener('click',()=>{
    zoom=!zoom;$('book-viewport').dataset.zoom=String(zoom);
    $('book-zoom').setAttribute('aria-pressed',String(zoom));
    const label=zoom?'Taille normale':'Agrandir les pages';$('book-zoom').title=label;$('book-zoom').setAttribute('aria-label',label);
  });
  for(const side of ['left','right'])$('book-image-'+side).addEventListener('error',()=>{$('book-error').hidden=false;});
  document.addEventListener('keydown',event=>{
    if($('panel-bonus').hidden || selection!=='fanzine' || event.defaultPrevented || ['INPUT','SELECT','BUTTON'].includes(event.target?.tagName))return;
    if(event.key==='ArrowLeft' || event.key==='ArrowRight') {event.preventDefault();showSpread(spread+(event.key==='ArrowRight'?1:-1));}
  });
  window.BONUS_READER={select,showSpread};
  select('poster');showSpread(0);
})();
