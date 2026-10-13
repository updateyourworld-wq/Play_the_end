window.WATER_SPRITES = {
  file:"mer-vagues-v1.png",
  frames:Array.from({length:6},(_,index)=>({x:index%3*32,y:Math.floor(index/3)*16,w:32,h:16})),
  columns:3
};
