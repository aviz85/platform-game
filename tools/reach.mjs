#!/usr/bin/env node
// Reachability + boss-kill proof. Dexterity-independent "is it beatable?" check.
//  - Platforming levels: BFS over tile grid with a physically-bounded jump/fall
//    model (measured: jump peak ~4.7 tiles, plain horiz ~5, air-dash ~7). Verdict
//    = can a skilled player reach the exit footing from spawn.
//  - Boss level: simulate the real Player attacking the real boss behavior to
//    confirm the boss can be damaged to 0 (not an unhittable soft-lock).
import { pathToFileURL } from 'url';
import { resolve } from 'path';

// headless stubs (art build + engine need canvas/DOM)
function sctx(c){return new Proxy({canvas:c},{get(t,p){if(p in t)return t[p];if(p==='getImageData')return(x,y,w,h)=>({data:new Uint8ClampedArray(Math.max(0,(w|0)*(h|0)*4))});if(p==='putImageData')return()=>{};if(p==='createLinearGradient'||p==='createRadialGradient')return()=>({addColorStop(){}});if(p==='createPattern')return()=>({});if(p==='measureText')return()=>({width:0});return()=>{}},set(t,p,v){t[p]=v;return true}})}
class Cv{constructor(w=1,h=1){this.width=w;this.height=h}getContext(){return sctx(this)}}
globalThis.OffscreenCanvas=Cv;globalThis.document={createElement:()=>new Cv()};
globalThis.window={innerWidth:1280,innerHeight:720,addEventListener(){}};
globalThis.performance=globalThis.performance||{now:()=>0};globalThis.requestAnimationFrame=()=>0;

const ROOT=resolve(process.argv[2]||'.');
const imp=(p)=>import(pathToFileURL(resolve(ROOT,p)).href);
const {loadContent}=await imp('src/content/registry.js');
const {World}=await imp('src/game/world.js');
const {Camera}=await imp('src/engine/camera.js');
const {Particles}=await imp('src/engine/particles.js');
const {TILE}=await imp('src/engine/physics.js');
const content=loadContent();
const audio={sfxMap:content.SFX,musicMap:content.MUSIC,playSfx(){},playMusic(){},stopMusic(){},unlock(){},toggleMute(){}};

const HARD=new Set(['#','X','|']);      // blocks head + movement
const FLOOR=new Set(['#','X','|','=']); // can stand on top

function grid(def){
  const rows=def.map, R=rows.length, C=Math.max(...rows.map(r=>r.length));
  const at=(c,r)=>{ if(r<0||r>=R) return r<0?'.':'#'; const row=rows[r]; if(c<0||c>=C) return '#'; return row[c]||'.'; };
  return {R,C,at,
    hard:(c,r)=>HARD.has(at(c,r)),
    floor:(c,r)=>FLOOR.has(at(c,r)),
    hazard:(c,r)=>at(c,r)==='^',
  };
}
const key=(c,r)=>c+','+r;

// a standing spot: (c,r) not hard, floor below, not standing IN hazard
function standSpots(g){
  const s=new Set();
  for(let r=0;r<g.R;r++)for(let c=0;c<g.C;c++){
    if(!g.hard(c,r) && g.floor(c,r+1) && g.at(c,r)!=='^') s.add(key(c,r));
  }
  return s;
}
// nearest standing spot at/below a given tile (for spawn/exit anchoring)
function footingAt(g,S,c,r){
  for(let d=0;d<=4;d++) if(S.has(key(c,r+d))) return key(c,r+d);
  return key(c,r);
}

// jump horizontal envelope by height gained (plain+dash, generous for a skilled player)
// up=0 is a flat leap across a pit (~7 tiles with air-dash); higher jumps cover less.
const upDX=(up)=>up<=0?8:up<=2?7:up<=3?6:up<=4?5:-1;
// clear vertical corridor above start column so the player can rise `up` tiles
function headClear(g,c,r,up){ for(let i=1;i<=up;i++) if(g.hard(c,r-i)) return false; return true; }

function reachable(def){
  const g=grid(def);
  const S=standSpots(g);
  const start=footingAt(g,S,def.spawn.x,def.spawn.y);
  const goal=footingAt(g,S,def.exit.x,def.exit.y);
  if(!S.has(start)) return {ok:false,why:`spawn footing ${start} not standable`};
  const seen=new Set([start]); const q=[start]; let head=0;
  const push=(c,r)=>{const k=key(c,r); if(S.has(k)&&!seen.has(k)){seen.add(k);q.push(k);}};
  while(head<q.length){
    const [c,r]=q[head++].split(',').map(Number);
    // walk / step up-down 1
    for(const dc of [-1,1]){
      push(c+dc,r); push(c+dc,r+1);
      if(!g.hard(c+dc,r-1)&&!g.hard(c,r-1)) push(c+dc,r-1);
    }
    // jump — flat (up=0, across a pit) and upward (up=1..4)
    for(let up=0;up<=4;up++){
      if(!headClear(g,c,r,up)) break;
      const mdx=upDX(up);
      for(let dc=-mdx;dc<=mdx;dc++){
        if(up===0&&dc===0) continue;
        const nc=c+dc,nr=r-up;
        if(!S.has(key(nc,nr))) continue;
        if(g.hard(nc,nr-1)) continue;        // landing head room
        push(nc,nr);
      }
    }
    // fall (any drop, horiz <=8, must be able to leave the ledge)
    for(const dir of [-1,1]){
      if(g.hard(c+dir,r)) continue;          // can't step off into a wall
      for(let dc=1;dc<=8;dc++){
        const nc=c+dir*dc;
        for(let nr=r+1;nr<r+40&&nr<g.R;nr++){
          if(g.hard(nc,nr)) break;
          if(S.has(key(nc,nr))){ push(nc,nr); break; }
        }
      }
    }
  }
  if(seen.has(goal)) return {ok:true,nodes:seen.size,total:S.size};
  // report how far right the reachable frontier got
  let maxC=0; for(const k of seen){const c=+k.split(',')[0]; if(c>maxC)maxC=c;}
  return {ok:false,why:`exit ${goal} not reached; frontier max col ${maxC}, exit col ${Math.floor(def.exit.x)}`,nodes:seen.size,total:S.size};
}

// boss killability: real Player vs real boss behavior, player kept alive, attacking
function bossKillable(def){
  const cam=new Camera(480,270), parts=new Particles(content.ART.fx_particles);
  const world=new World(def,content,audio,cam,parts,480,270);
  const boss=world.entities.find(e=>e.behavior.isBoss);
  if(!boss) return {ok:false,why:'no boss entity'};
  const startHp=boss.hp;
  const p=world.player;
  const bot={d:{},prev:{},frame(n){this.prev=this.d;this.d=n},isDown(a){return!!this.d[a]},justPressed(a){return!!this.d[a]&&!this.prev[a]}};
  let lastX=p.x, stuck=0, jumpHold=0;
  for(let f=0;f<60*90;f++){
    const b=world.entities.find(e=>e.behavior.isBoss&&!e.dead);
    const inp={};
    if(b){
      const dir=Math.sign(b.x-p.x)||1;
      if(Math.abs(b.x-p.x)>16){ if(dir>0)inp.right=true;else inp.left=true; }
      // jump over the pedestal/gate lip (or up to a leaping boss) when horizontally stuck
      if(Math.abs(p.x-lastX)<0.5 && Math.abs(b.x-p.x)>16) stuck++; else stuck=0;
      lastX=p.x;
      if(p.onGround && (stuck>5 || (b.y < p.y-20 && Math.abs(b.x-p.x)<70))) jumpHold=12;
      if(jumpHold>0){ inp.jump=true; jumpHold--; }
      if(f%24<1) inp.attack=true; // pulse: attack fires on the key-press edge
    }
    bot.frame(inp);
    world.update(1/60,bot);
    p.inv=1; p.hp=p.maxHp; // keep player alive — we're testing boss vulnerability, not player survival
    if(world.events.includes('bossDead')) return {ok:true,hits:`${startHp} hp destroyed in ${(f/60).toFixed(1)}s`};
  }
  const b=world.entities.find(e=>e.behavior.isBoss);
  return {ok:false,why:`boss hp only fell ${startHp}->${b?b.hp:'?'} in 90s (unhittable / softlock?)`};
}

let allOk=true;
console.log('AETHERFALL beatability proof (BFS reachability + boss-kill sim)\n');
for(let i=0;i<content.LEVELS.length;i++){
  const def=content.LEVELS[i];
  let r;
  if(i===5){ r=bossKillable(def); console.log(`  L${i+1} ${(def.name||'').padEnd(18)} ${r.ok?'BEATABLE ✓':'BLOCKED ✗'}  ${r.ok?('boss killable — '+r.hits):r.why}`); }
  else { r=reachable(def); console.log(`  L${i+1} ${(def.name||'').padEnd(18)} ${r.ok?'BEATABLE ✓':'BLOCKED ✗'}  ${r.ok?`exit reachable (${r.nodes}/${r.total} footings)`:r.why}`); }
  allOk=allOk&&r.ok;
}
console.log('\n'+(allOk?'BEATABLE — every level\'s exit is reachable and the boss is killable'
                      :'BLOCKED — a level exit is unreachable or the boss is unkillable (see above)'));
process.exit(allOk?0:1);
