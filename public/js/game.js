{
const $=s=>document.querySelector(s);
const N=8, D4=[[1,0],[-1,0],[0,1],[0,-1]], SPEC=new Set(['h','v','w','b']);
const FR=['🍓','🍊','🍋','🍏','🍇','🫐'], FC=['#ff3b5c','#ff9419','#f5c400','#4fbf2e','#9b4dff','#3f6dff'];
const NM=['strawberries','oranges','lemons','apples','grapes','blueberries'];
// Fall back to watermelon where the blueberry emoji is missing (older phones)
(function(){try{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.font='28px sans-serif';x.textBaseline='top';x.fillText('🫐',0,0);const d=x.getImageData(0,0,32,32).data;let n=0;for(let i=0;i<d.length;i+=4){if(d[i+3]>60&&Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])>50)n++}if(n<15){FR[5]='🍉';FC[5]='#2fae55';NM[5]='watermelons';const f=$('.f6');if(f)f.textContent='🍉'}}catch(e){}})();
const STAR=c=>`<svg class="star ${c||''}" viewBox="0 0 24 24"><use href="#starP"/></svg>`;
const TICK='<svg class="gtick" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ARR='<svg class="arr" viewBox="0 0 40 40"><path d="M2 20l7-6v12zM38 20l-7-6v12z"/></svg>';
const fmt=n=>n.toLocaleString('en-US');

/* ---------- save ---------- */
const SKEY='orchardpop.v1';
let save={unlocked:1,stars:{},best:{},muted:false};
try{const s=JSON.parse(localStorage.getItem(SKEY));if(s&&typeof s==='object')save=Object.assign(save,s)}catch(e){}
const persist=()=>{try{localStorage.setItem(SKEY,JSON.stringify(save))}catch(e){}};

/* ---------- sound ---------- */
const A={ctx:null,m:null,
  init(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.m=this.ctx.createGain();this.m.gain.value=.55;this.m.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume()}catch(e){}},
  t(f,d,type='sine',v=.2,f2=0,dl=0){if(save.muted||!this.ctx||SPEED<.2)return;const c=this.ctx,t0=c.currentTime+dl,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+d);g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(v,t0+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g).connect(this.m);o.start(t0);o.stop(t0+d+.03)},
  n(d,v=.2,f1=1000,f2=0,type='bandpass',dl=0){if(save.muted||!this.ctx||SPEED<.2)return;const c=this.ctx,t0=c.currentTime+dl,len=Math.max(1,c.sampleRate*d|0),b=c.createBuffer(1,len,c.sampleRate),ch=b.getChannelData(0);for(let i=0;i<len;i++)ch[i]=Math.random()*2-1;const s=c.createBufferSource();s.buffer=b;const fl=c.createBiquadFilter();fl.type=type;fl.frequency.setValueAtTime(f1,t0);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t0+d);const g=c.createGain();g.gain.setValueAtTime(v,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(fl).connect(g).connect(this.m);s.start(t0);s.stop(t0+d+.03)}};
const S={
  swap(){A.t(480,.08,'sine',.12,720)},
  bad(){A.t(210,.08,'square',.05,160);A.t(160,.12,'square',.05,110,.08)},
  pop(ch){const f=440*Math.pow(2,Math.min(ch-1,12)*2/12);A.t(f,.14,'triangle',.2,f*1.6);A.t(f*1.5,.1,'sine',.07,0,.04)},
  make(){[660,880,1320].forEach((f,i)=>A.t(f,.16,'triangle',.13,0,i*.06))},
  ding(){A.t(1200+Math.random()*300,.1,'triangle',.1)},
  line(){A.n(.32,.3,500,4000);A.t(900,.25,'sawtooth',.035,300)},
  boom(){A.t(150,.4,'sine',.4,40);A.n(.3,.3,900,120,'lowpass')},
  bomb(){for(let i=0;i<8;i++)A.t(500+i*140,.12,'triangle',.09,0,i*.035);A.n(.4,.12,2000,6000,'highpass')},
  ice(){A.n(.09,.3,3500,0,'highpass');A.t(2300,.06,'square',.025,1400)},
  jelly(){A.t(260,.14,'sine',.12,430)},
  land(){A.t(140,.05,'sine',.05,90)},
  win(){[523,659,784,1046,784,1046].forEach((f,i)=>A.t(f,i===5?.5:.16,'triangle',.17,0,i*.12))},
  fail(){[392,330,262,196].forEach((f,i)=>A.t(f,.28,'triangle',.14,0,i*.18))},
  star(i){A.t(880+i*220,.3,'triangle',.17);A.t(1760+i*440,.2,'sine',.05,0,.05)},
  click(){A.t(700,.05,'sine',.09,900)},
  shuffle(){for(let i=0;i<7;i++)A.t(300+Math.random()*600,.07,'sine',.07,0,i*.05)}};

let SPEED=1;
const wait=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- level generation (endless, seeded) ---------- */
function mulberry32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const g0=()=>Array.from({length:N},()=>Array(N).fill(0));
const SHAPES=[(r,c)=>Math.abs(r-3.5)+Math.abs(c-3.5)<=4,(r,c)=>r>=3,(r,c)=>r>=1&&r<=6&&c>=1&&c<=6,
  (r,c)=>r===0||r===7||c===0||c===7||(r>2&&r<5&&c>2&&c<5),(r,c)=>(r+Math.min(c,7-c))%2===0,
  (r,c)=>Math.abs(r-c)<=1||Math.abs(r+c-7)<=1,(r,c)=>r%3!==1,(r,c)=>c<=1||c>=6||r>=6,(r,c)=>r<=1||r>=5];
function shape(R,target,avoid){
  const m=g0(),f=SHAPES[Math.floor(R()*SHAPES.length)];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(f(r,c)&&!(avoid&&avoid[r][c]))m[r][c]=1;
  const cnt=()=>m.flat().reduce((a,b)=>a+b,0);let g=0;
  while(cnt()>target+1&&g++<600){const r=Math.floor(R()*N),c=Math.floor(R()*4);if(m[r][c]){m[r][c]=0;m[r][7-c]=0}}
  while(cnt()<target-1&&g++<1200){const r=Math.floor(R()*N),c=Math.floor(R()*4);if(!m[r][c]&&!(avoid&&avoid[r][c])){m[r][c]=1;m[r][7-c]=1}}
  return m}
const nice=x=>Math.max(100,Math.round(x/100)*100);
function genLevel(n){
  const R=mulberry32(n*7919+31),ri=(a,b)=>a+Math.floor(R()*(b-a+1));
  const intro=[null,'score','collect','jelly','collect','ice','jelly','score','jellyice','collect','ice'];
  const pool=['score','collect','collect','jelly','jelly','jelly','ice','jellyice','collectice'];
  const type=intro[n]||pool[Math.floor(R()*pool.length)];
  const colors=n<=4?5:(R()<Math.min(.8,.2+n*.03)?6:5);
  const L={n,type,colors,jelly:g0(),ice:g0(),goals:[]};
  const d=Math.min(n,50);
  const slack=Math.max(1.12,1.5-d*.012);
  let work=0;
  if(type.includes('jelly')){
    const m=shape(R,Math.min(colors===6?30:34,12+Math.round(d*1.6))-(type==='jellyice'?8:0)),dbl=n>=9?Math.min(.45,(d-8)*.04):0;let lay=0;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(m[r][c]){L.jelly[r][c]=R()<dbl?2:1;lay+=L.jelly[r][c]}
    L.goals.push({t:'jelly',need:lay});work+=6+lay*(colors===6?.62:.45);
  }
  if(type.includes('ice')){
    const m=shape(R,Math.min(22,6+Math.round(d*.7))-(type==='ice'?0:4)),dbl=n>=12?Math.min(.5,(d-11)*.05):0;let lay=0;
    for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(m[r][c]){L.ice[r][c]=R()<dbl?2:1;lay+=L.ice[r][c]}
    L.goals.push({t:'ice',need:lay});work+=type==='ice'?lay/2.2+4:lay/2.5;
  }
  if(type.includes('collect')){
    const k=(n>=6&&R()<.5)?2:1,fs=[];while(fs.length<k){const f=ri(0,L.colors-1);if(!fs.includes(f))fs.push(f)}
    const per=Math.round(Math.min(L.colors===6?45:55,18+d*1.3)*(k===2?.75:1));
    fs.forEach(f=>L.goals.push({t:'collect',f,need:per}));work+=per/(L.colors===6?1.5:2.9)*(k===2?1.15:1)+4;
  }
  const ppm=L.colors===6?280:550;
  if(type==='score'){
    L.moves=ri(18,24);const s1=nice(L.moves*ppm*Math.min(.75,.5+d*.006));
    L.s1=s1;L.s2=nice(s1*1.4);L.s3=nice(s1*1.8);L.goals.push({t:'score',need:s1});
  }else{
    L.moves=Math.min(48,Math.max(12,Math.round(work*slack)));
    const pn=L.colors===6?400:550;L.s2=nice(L.moves*pn*.7);L.s3=nice(L.moves*pn*1.1);L.s1=nice(L.s2*.5);
  }
  return L}

/* ---------- state ---------- */
let L=null,G=null,cell=56,pid=0,sel=null,hintT=0,hintEls=[],curN=1;
const tilesEl=$('#tiles'),cellsEl=$('#cells'),iceEl=$('#iceL'),fxEl=$('#fx'),boardEl=$('#board');
const rc=()=>Math.floor(Math.random()*L.colors);
const inB=(r,c)=>r>=0&&r<N&&c>=0&&c<N;
const at=k=>G.grid[k/N|0][k%N];

function mk(f,s=''){const el=document.createElement('div');el.className='tile';el.innerHTML='<div class="in"><b class="em"></b>'+ARR+'</div>';const p={id:++pid,f,s,el,r:0,c:0};paint(p);tilesEl.appendChild(el);return p}
function paint(p){const i=p.el.firstChild;i.className='in'+(p.s?' s-'+p.s:'');p.el.style.setProperty('--fc',p.f>=0?FC[p.f]:'#fff');i.firstChild.textContent=p.s==='b'?'':FR[p.f]}
function pos(p,r,c,dur=0,ease){p.r=r;p.c=c;p.el.style.transitionDuration=(dur*SPEED)+'ms';p.el.style.transitionTimingFunction=ease||'';p.el.style.transform=`translate3d(${c*cell}px,${r*cell}px,0)`}
function bounce(p){if(p&&p.el)p.el.firstChild.animate([{transform:'scale(1)'},{transform:'scale(1.4)'},{transform:'scale(1)'}],{duration:Math.max(1,300*SPEED),easing:'ease-out'})}
function nudge(p){p.el.firstChild.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],{duration:220})}

/* ---------- matching ---------- */
const matchable=p=>p&&p.s!=='b'&&p.s!=='a';
const isCombo=(a,b)=>(SPEC.has(a.s)&&SPEC.has(b.s))||a.s==='b'||b.s==='b';
function findRuns(){
  const runs=[];
  for(let r=0;r<N;r++){let c=0;while(c<N){const p=G.grid[r][c];if(!matchable(p)){c++;continue}let e=c+1;while(e<N&&matchable(G.grid[r][e])&&G.grid[r][e].f===p.f)e++;if(e-c>=3){const cs=[];for(let x=c;x<e;x++)cs.push(r*N+x);runs.push({dir:'h',cells:cs})}c=e}}
  for(let c=0;c<N;c++){let r=0;while(r<N){const p=G.grid[r][c];if(!matchable(p)){r++;continue}let e=r+1;while(e<N&&matchable(G.grid[e][c])&&G.grid[e][c].f===p.f)e++;if(e-r>=3){const cs=[];for(let y=r;y<e;y++)cs.push(y*N+c);runs.push({dir:'v',cells:cs})}r=e}}
  return runs}
function groupRuns(runs){
  const gs=runs.map(r=>({runs:[r],set:new Set(r.cells)}));let merged=true;
  while(merged){merged=false;outer:for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){if([...gs[j].set].some(k=>gs[i].set.has(k))){gs[i].runs.push(...gs[j].runs);gs[j].set.forEach(k=>gs[i].set.add(k));gs.splice(j,1);merged=true;break outer}}}
  return gs}
function specialFor(g){let mx=0,h=0,v=0;for(const r of g.runs){mx=Math.max(mx,r.cells.length);r.dir==='h'?h++:v++}
  if(mx>=5)return'b';if(h&&v)return'w';if(mx===4)return g.runs.find(r=>r.cells.length===4).dir==='h'?'v':'h';return null}
function spawnAt(g,sp){
  const ok=k=>{const p=at(k);return p&&!G.ice[k/N|0][k%N]&&!SPEC.has(p.s)};
  if(G.swap)for(const k of G.swap)if(g.set.has(k)&&ok(k))return k;
  const pref=[];
  if(sp==='w'){const hs=new Set();g.runs.filter(x=>x.dir==='h').forEach(x=>x.cells.forEach(k=>hs.add(k)));g.runs.filter(x=>x.dir==='v').forEach(x=>x.cells.forEach(k=>{if(hs.has(k))pref.push(k)}))}
  const lg=g.runs.reduce((a,b)=>b.cells.length>a.cells.length?b:a);pref.push(lg.cells[(lg.cells.length-1)>>1],...g.set);
  const k=pref.find(ok);return k===undefined?null:k}
function lineAt(r,c){const p=G.grid[r][c];if(!matchable(p))return 0;const f=p.f,same=(y,x)=>inB(y,x)&&matchable(G.grid[y][x])&&G.grid[y][x].f===f;
  let h=1,v=1;for(let x=c-1;same(r,x);x--)h++;for(let x=c+1;same(r,x);x++)h++;for(let y=r-1;same(y,c);y--)v++;for(let y=r+1;same(y,c);y++)v++;
  return(h>=3?h:0)+(v>=3?v:0)}
const movable=(r,c)=>G.grid[r][c]&&!G.ice[r][c];
function findMoves(){const res=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const[dr,dc]of[[0,1],[1,0]]){const r2=r+dr,c2=c+dc;if(!inB(r2,c2)||!movable(r,c)||!movable(r2,c2))continue;
    const a=G.grid[r][c],b=G.grid[r2][c2];if(isCombo(a,b)){res.push([r,c,r2,c2,1]);continue}
    G.grid[r][c]=b;G.grid[r2][c2]=a;const ok=lineAt(r,c)||lineAt(r2,c2);G.grid[r][c]=a;G.grid[r2][c2]=b;if(ok)res.push([r,c,r2,c2,0])}
  return res}
function rateMove(m){const[r1,c1,r2,c2,cb]=m,a=G.grid[r1][c1],b=G.grid[r2][c2];
  if(cb)return 60+(a.s==='b'||b.s==='b'?40:0)+(a.s&&b.s?30:0);
  G.grid[r1][c1]=b;G.grid[r2][c2]=a;let sc=0;
  for(const g of groupRuns(findRuns())){const sp=specialFor(g);sc+=g.set.size*2+(sp==='b'?40:sp==='w'?22:sp?14:0);
    g.set.forEach(k=>{const r=k/N|0,c=k%N,p=at(k);sc+=G.jelly[r][c]*3+r*.15;if(p&&SPEC.has(p.s))sc+=8;
      if(L.goals.some(x=>x.t==='collect'&&x.f===p.f&&(G.coll[p.f]||0)<x.need))sc+=2.5;
      for(const[dr,dc]of D4){const y=r+dr,x=c+dc;if(inB(y,x)&&G.ice[y][x])sc+=2.5}})}
  G.grid[r1][c1]=a;G.grid[r2][c2]=b;return sc}

/* ---------- clearing ---------- */
function commonColor(){const n=Array(6).fill(0);G.grid.forEach((row,r)=>row.forEach((p,c)=>{if(p&&p.f>=0&&!p.s&&!G.ice[r][c])n[p.f]++}));let b=0;n.forEach((v,i)=>{if(v>n[b])b=i});return n[b]?b:rc()}
function resolveClear(seeds,spawns=new Map(),adj=new Set(),toward=new Map()){
  const out={rm:[],arm:[],jel:[],ice:[],fx:[],spawn:[],toward},done=new Set(),q=[...seeds];
  const hitJ=k=>{if(G.jelly[k/N|0][k%N]>0)out.jel.push(k)};
  for(const[k,sp]of spawns){done.add(k);hitJ(k);out.spawn.push([k,sp])}
  const add=(y,x)=>{if(inB(y,x))q.push(y*N+x)};
  while(q.length){const k=q.shift();if(done.has(k))continue;done.add(k);const r=k/N|0,c=k%N,p=G.grid[r][c];
    if(G.ice[r][c]){out.ice.push(k);continue}
    hitJ(k);if(!p)continue;
    if(p.s==='h'){for(let x=0;x<N;x++)add(r,x);out.fx.push({t:'h',r,c,f:p.f})}
    else if(p.s==='v'){for(let y=0;y<N;y++)add(y,c);out.fx.push({t:'v',r,c,f:p.f})}
    else if(p.s==='w'||p.s==='a'){for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)add(r+dy,c+dx);out.fx.push({t:'w',r,c,f:p.f,s:1.5});if(p.s==='w'){out.arm.push(k);continue}}
    else if(p.s==='b'){const f=commonColor(),tg=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++){const o=G.grid[y][x];if(o&&o!==p&&o.f===f){add(y,x);tg.push(y*N+x)}}out.fx.push({t:'b',r,c,tg,f})}
    out.rm.push(k)}
  for(const k of adj)if(!done.has(k)){done.add(k);out.ice.push(k)}
  return out}
async function applyClear(res){
  const kinds=new Set(res.fx.map(e=>e.t));
  for(const e of res.fx){if(e.t==='h'||e.t==='v')beam(e);else if(e.t==='w')ring(e);else if(e.t==='b')zap(e);else if(e.t==='all')flash()}
  if(kinds.has('h')||kinds.has('v'))S.line();if(kinds.has('w'))S.boom();if(kinds.has('b')||kinds.has('all'))S.bomb();
  if(kinds.size)await wait(150);
  let pts=0,sx=0,sy=0,n=0;const mult=Math.max(1,G.chain),bumped=new Set();
  if(res.ice.length){S.ice();for(const k of res.ice){const r=k/N|0,c=k%N;if(G.ice[r][c]>0){G.ice[r][c]--;pts+=60;updateCell(r,c);shards(r,c)}}}
  if(res.jel.length){S.jelly();for(const k of res.jel){const r=k/N|0,c=k%N;if(G.jelly[r][c]>0){G.jelly[r][c]--;pts+=100;updateCell(r,c)}}}
  const many=res.rm.length>18;
  for(const k of res.rm){const r=k/N|0,c=k%N,p=G.grid[r][c];if(!p)continue;G.grid[r][c]=null;
    if(p.f>=0){G.coll[p.f]=(G.coll[p.f]||0)+1;bumped.add(p.f)}pts+=20*mult;sx+=c;sy+=r;n++;
    const to=res.toward.get(k);popOut(p,to);if(to===undefined&&!REDUCED)particles(r,c,p.f,many?2:5)}
  for(const[k,sp]of res.spawn){const p=at(k);if(!p)continue;if(p.f>=0){G.coll[p.f]=(G.coll[p.f]||0)+1;bumped.add(p.f)}
    p.s=sp.s;if(sp.s==='b')p.f=-1;paint(p);setTimeout(()=>bounce(p),120*SPEED);pts+=sp.s==='b'?300:sp.s==='w'?200:120;sx+=k%N;sy+=k/N|0;n++}
  for(const k of res.arm){const p=at(k);if(p){p.s='a';paint(p)}}
  if(res.spawn.length)S.make();if(n)S.pop(mult);
  G.score+=pts;if(n&&pts)floatText((sx/n+.5)*cell,(sy/n+.5)*cell,'+'+pts,G.chain>2);
  hud(bumped);await wait(240)}
function popOut(p,to){const el=p.el;
  if(to!==undefined){el.style.transitionDuration=(150*SPEED)+'ms';el.style.transform=`translate3d(${(to%N)*cell}px,${(to/N|0)*cell}px,0)`;el.style.opacity='0'}
  else el.firstChild.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.3)',opacity:1,offset:.35},{transform:'scale(0)',opacity:0}],{duration:Math.max(1,230*SPEED),easing:'ease-in',fill:'forwards'});
  setTimeout(()=>el.remove(),260*SPEED+30)}
const fallDur=d=>110+Math.sqrt(Math.max(1,d))*105;
async function gravity(){
  let mx=0;const fresh=[];
  for(let c=0;c<N;c++){const free=[];for(let r=N-1;r>=0;r--)if(!G.ice[r][c])free.push(r);
    const list=[];for(const r of free)if(G.grid[r][c]){list.push([G.grid[r][c],r]);G.grid[r][c]=null}
    let i=0;for(;i<list.length;i++){const[p,from]=list[i],to=free[i];G.grid[to][c]=p;if(to!==from){const d=fallDur(to-from);pos(p,to,c,d);mx=Math.max(mx,d)}}
    let j=0;for(;i<free.length;i++){j++;const to=free[i],p=mk(rc());G.grid[to][c]=p;pos(p,-j,c,0);fresh.push([p,to,c,j])}}
  if(fresh.length){void tilesEl.offsetWidth;for(const[p,to,c,j]of fresh){const d=fallDur(to+j);pos(p,to,c,d);mx=Math.max(mx,d)}}
  if(mx){await wait(mx);S.land()}}
async function cascade(){
  for(let guard=0;guard<80;guard++){
    const armed=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(G.grid[r][c]&&G.grid[r][c].s==='a')armed.push(r*N+c);
    const runs=findRuns();if(!runs.length&&!armed.length)break;
    G.chain++;const seeds=new Set(armed),spawns=new Map(),toward=new Map(),adj=new Set();
    for(const g of groupRuns(runs)){g.set.forEach(k=>seeds.add(k));const sp=specialFor(g);
      if(sp){const k=spawnAt(g,sp);if(k!==null){spawns.set(k,{s:sp});g.set.forEach(x=>{if(x!==k&&!G.ice[x/N|0][x%N])toward.set(x,k)})}}
      g.set.forEach(k=>{const r=k/N|0,c=k%N;for(const[dr,dc]of D4){const y=r+dr,x=c+dc;if(inB(y,x)&&G.ice[y][x])adj.add(y*N+x)}})}
    await applyClear(resolveClear(seeds,spawns,adj,toward));G.swap=null;await gravity()}}
async function combo(a,b){
  const sa=a.s,sb=b.s,r=a.r,c=a.c,seeds=new Set(),fx=[],line=x=>x==='h'||x==='v',all=f=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(f(y,x))seeds.add(y*N+x)};
  if(sa==='b'&&sb==='b'){a.s=b.s='';all(()=>true);fx.push({t:'all'})}
  else if(sa==='b'||sb==='b'){const bomb=sa==='b'?a:b,o=bomb===a?b:a;bomb.s='';const tg=[];
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const p=G.grid[y][x];if(p&&p!==bomb&&p.f===o.f)tg.push(y*N+x)}
    zap({r:bomb.r,c:bomb.c,tg,f:o.f});S.bomb();await wait(320);
    if(SPEC.has(o.s)){for(const k of tg){const p=at(k);if(p&&!p.s&&!G.ice[k/N|0][k%N]){p.s=o.s==='w'?'w':(Math.random()<.5?'h':'v');paint(p);bounce(p)}}S.make();await wait(360)}
    tg.forEach(k=>seeds.add(k));seeds.add(bomb.r*N+bomb.c)}
  else if(line(sa)&&line(sb)){a.s=b.s='';all((y,x)=>y===r||x===c);fx.push({t:'h',r,c,f:a.f},{t:'v',r,c,f:b.f})}
  else if(sa==='w'&&sb==='w'){a.s=b.s='';all((y,x)=>Math.abs(y-r)<=2&&Math.abs(x-c)<=2);fx.push({t:'w',r,c,f:a.f,s:2.6})}
  else{a.s=b.s='';all((y,x)=>Math.abs(y-r)<=1||Math.abs(x-c)<=1);for(let d=-1;d<=1;d++){if(inB(r+d,c))fx.push({t:'h',r:r+d,c,f:a.f});if(inB(r,c+d))fx.push({t:'v',r,c:c+d,f:b.f})}}
  seeds.add(a.r*N+a.c);seeds.add(b.r*N+b.c);
  const res=resolveClear(seeds);res.fx.unshift(...fx);await applyClear(res);await gravity()}

/* ---------- turn flow ---------- */
async function trySwap(r1,c1,r2,c2){
  if(!G||G.busy||G.over||!inB(r2,c2)||Math.abs(r1-r2)+Math.abs(c1-c2)!==1)return;
  const a=G.grid[r1][c1],b=G.grid[r2][c2];if(!a||!b)return;
  setSel(null);clearHint();
  if(G.ice[r1][c1]||G.ice[r2][c2]){S.bad();nudge(G.ice[r1][c1]?a:b);toast('Frozen fruit can’t move — match next to it!');armHint();return}
  G.busy=true;S.swap();a.el.style.zIndex=2;pos(a,r2,c2,170);pos(b,r1,c1,170);await wait(180);a.el.style.zIndex='';
  G.grid[r2][c2]=a;G.grid[r1][c1]=b;
  if(isCombo(a,b)){G.moves--;hud();G.chain=1;await combo(a,b);await cascade();return afterTurn()}
  if(lineAt(r1,c1)||lineAt(r2,c2)){G.moves--;hud();G.chain=0;G.swap=[r2*N+c2,r1*N+c1];await cascade();return afterTurn()}
  S.bad();pos(a,r1,c1,170);pos(b,r2,c2,170);await wait(180);G.grid[r1][c1]=a;G.grid[r2][c2]=b;G.busy=false;armHint()}
const sumG=g=>g.flat().reduce((a,b)=>a+b,0);
function prog(g){return g.t==='score'?G.score:g.t==='jelly'?g.need-sumG(G.jelly):g.t==='ice'?g.need-sumG(G.ice):(G.coll[g.f]||0)}
const goalsMet=()=>L.goals.every(g=>prog(g)>=g.need);
const PRAISE=['Juicy!','Fresh!','Fruity!','Ripe & ready!','Orchard-tastic!'];
async function afterTurn(){
  hud();if(G.chain>=3){banner(PRAISE[Math.min(G.chain-3,4)]);await wait(350)}
  const met=goalsMet();
  if(L.type==='score'){if(met&&!G.reached){G.reached=true;toast('Target reached! Use your moves for more stars')}if(G.moves<=0)return met?win():fail()}
  else if(met){G.over=true;await bonus();return win()}
  else if(G.moves<=0)return fail();
  if(!findMoves().length)await shuffle();
  G.busy=false;armHint()}
async function bonus(){
  await wait(300);
  if(G.moves>0){banner('Orchard Bonus!');await wait(800);
    for(let g=0;G.moves>0&&g<40;g++){const cand=[];G.grid.forEach((row,r)=>row.forEach((p,c)=>{if(p&&!p.s&&!G.ice[r][c])cand.push(p)}));if(!cand.length)break;
      const p=cand[Math.floor(Math.random()*cand.length)];p.s=Math.random()<.5?'h':'v';paint(p);bounce(p);G.moves--;hud();S.ding();await wait(110)}
    G.moves=0;hud()}
  for(let i=0;i<30;i++){const sp=[];G.grid.forEach((row,r)=>row.forEach((p,c)=>{if(p&&SPEC.has(p.s))sp.push(r*N+c)}));if(!sp.length)break;
    G.chain=1;await applyClear(resolveClear(new Set(sp)));await gravity();await cascade()}
  await wait(300)}
async function shuffle(){
  banner('No moves — shuffling!');S.shuffle();
  const ps=[];G.grid.forEach((row,r)=>row.forEach((p,c)=>{if(p&&!p.s&&!G.ice[r][c])ps.push(p)}));
  let fs=ps.map(p=>p.f),ok=false;
  for(let t=0;t<300&&!ok;t++){if(t>150)fs=fs.map(()=>rc());for(let i=fs.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[fs[i],fs[j]]=[fs[j],fs[i]]}ps.forEach((p,i)=>p.f=fs[i]);ok=!findRuns().length&&findMoves().length>0}
  ps.forEach(p=>{p.el.firstChild.animate([{transform:'scale(1) rotate(0)'},{transform:'scale(0) rotate(180deg)'},{transform:'scale(1) rotate(360deg)'}],{duration:Math.max(1,520*SPEED)});setTimeout(()=>paint(p),260*SPEED)});
  await wait(620);if(findRuns().length){G.chain=0;await cascade()}}
function stars(){const s=G.score;return s>=L.s3?3:s>=L.s2?2:1}
function win(){
  G.over=true;G.busy=true;clearHint();const st=stars(),n=L.n;
  save.stars[n]=Math.max(save.stars[n]||0,st);save.best[n]=Math.max(save.best[n]||0,G.score);save.unlocked=Math.max(save.unlocked,n+1);persist();
  S.win();
  modal(`<h2>Level ${n} complete!</h2><div class="bigstars">${[0,1,2].map(i=>STAR(i<st?'on':'')).join('')}</div>
    <p style="font-size:22px;font-weight:700">${fmt(G.score)}</p><p class="small">Best ${fmt(save.best[n])}</p>
    <div class="btns"><button class="btn" data-act="next">Next level</button><div class="row"><button class="btn alt sm" data-act="retry">Replay</button><button class="btn alt sm" data-act="map">Map</button></div></div>`);
  $('#modal').querySelectorAll('.bigstars .star.on').forEach((s,i)=>{s.style.animationDelay=(.35+i*.3)+'s';setTimeout(()=>S.star(i),(350+i*300)*SPEED)})}
function fail(){
  G.busy=true;clearHint();S.fail();
  const left=L.goals.filter(g=>prog(g)<g.need).map(g=>`<div class="gline">${gIcon(g)}<span>${g.t==='score'?fmt(g.need-G.score)+' more points':(g.need-prog(g))+' left'}</span></div>`).join('');
  modal(`<h2>Out of moves!</h2><p>So close. Still to go:</p><div class="glist">${left}</div>
    <div class="btns">${G.extra?'':'<button class="btn" data-act="extra">+5 moves</button><p class="small" style="margin:-4px 0 0">Free rescue, once per level</p>'}
    <button class="btn alt sm" data-act="retry">Try again</button><button class="link" data-act="map">Back to map</button></div>`)}

/* ---------- effects ---------- */
function fxDiv(cls,st){const d=document.createElement('div');d.className='fx '+cls;Object.assign(d.style,st);fxEl.appendChild(d);return d}
function anim(d,kf,ms,ease='ease-out'){d.animate(kf,{duration:Math.max(1,ms*SPEED),easing:ease,fill:'forwards'}).onfinish=()=>d.remove()}
function beam(e){const h=e.t==='h',col=e.f>=0?FC[e.f]:'#fff',th=cell*.6;
  const d=fxDiv('beam',h?{left:'-4%',width:'108%',top:(e.r+.5)*cell-th/2+'px',height:th+'px','--dir':'180deg'}:{top:'-4%',height:'108%',left:(e.c+.5)*cell-th/2+'px',width:th+'px','--dir':'90deg'});
  d.style.setProperty('--fc',col);d.style.transformOrigin=h?`${(e.c+.5)*cell}px 50%`:`50% ${(e.r+.5)*cell}px`;
  anim(d,[{transform:h?'scaleX(0)':'scaleY(0)',opacity:1},{transform:'scale(1)',opacity:1,offset:.45},{transform:h?'scaleY(.2)':'scaleX(.2)',opacity:0}],460)}
function ring(e){const s=e.s||1.5,sz=cell*s*2,d=fxDiv('ring',{left:(e.c+.5)*cell-sz/2+'px',top:(e.r+.5)*cell-sz/2+'px',width:sz+'px',height:sz+'px'});d.style.setProperty('--fc',e.f>=0?FC[e.f]:'#fff');
  anim(d,[{transform:'scale(.1)',opacity:1},{transform:'scale(1)',opacity:.9,offset:.6},{transform:'scale(1.15)',opacity:0}],480)}
function zap(e){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('class','fx');svg.style.cssText='left:0;top:0;width:100%;height:100%;overflow:visible';
  const x0=(e.c+.5)*cell,y0=(e.r+.5)*cell,col=e.f>=0?FC[e.f]:'#fff';
  for(const k of e.tg){const l=document.createElementNS(ns,'line');l.setAttribute('x1',x0);l.setAttribute('y1',y0);l.setAttribute('x2',(k%N+.5)*cell);l.setAttribute('y2',((k/N|0)+.5)*cell);l.setAttribute('stroke','#fff');l.setAttribute('stroke-width','4');l.setAttribute('stroke-linecap','round');l.style.filter=`drop-shadow(0 0 4px ${col})`;svg.appendChild(l)}
  fxEl.appendChild(svg);anim(svg,[{opacity:0},{opacity:1,offset:.2},{opacity:1,offset:.6},{opacity:0}],560)}
function flash(){const d=fxDiv('',{inset:'0',background:'#fff',borderRadius:'14px'});anim(d,[{opacity:0},{opacity:.95,offset:.3},{opacity:0}],600)}
function particles(r,c,f,n){const col=f>=0?FC[f]:'#fff';for(let i=0;i<n;i++){const a=Math.random()*6.283,dist=cell*(.6+Math.random()*.8),sz=5+Math.random()*7;
  const d=fxDiv('pt',{left:(c+.5)*cell+'px',top:(r+.5)*cell+'px',width:sz+'px',height:sz+'px',background:col});
  anim(d,[{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*dist}px,${Math.sin(a)*dist+cell*.3}px) scale(.2)`,opacity:0}],420+Math.random()*200)}}
function shards(r,c){if(REDUCED)return;for(let i=0;i<5;i++){const a=Math.random()*6.283,dist=cell*(.4+Math.random()*.5);const d=fxDiv('pt',{left:(c+.5)*cell+'px',top:(r+.5)*cell+'px',width:'8px',height:'8px',borderRadius:'2px',background:'#e8f6ff',boxShadow:'0 0 4px #8cc8f5'});
  anim(d,[{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*dist}px,${Math.sin(a)*dist}px) rotate(200deg)`,opacity:0}],450)}}
function floatText(x,y,t,big){const d=fxDiv('flt',{left:x+'px',top:y+'px',fontSize:(big?28:21)+'px'});d.textContent=t;anim(d,[{transform:'translate(-50%,-50%) scale(.6)',opacity:0},{transform:'translate(-50%,-90%) scale(1.1)',opacity:1,offset:.25},{transform:'translate(-50%,-180%) scale(1)',opacity:0}],900)}
function banner(t){const b=$('#banner');b.textContent=t;b.getAnimations().forEach(a=>a.cancel());b.animate([{transform:'translate(-50%,-50%) scale(.3) rotate(-8deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.1) rotate(-3deg)',opacity:1,offset:.25},{transform:'translate(-50%,-50%) scale(1) rotate(-3deg)',opacity:1,offset:.75},{transform:'translate(-50%,-70%) scale(1)',opacity:0}],{duration:Math.max(1,1300*SPEED),easing:'ease-out'})}
let toastT=0;function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>e.classList.remove('on'),2600)}

/* ---------- board building & hud ---------- */
function buildCells(){cellsEl.innerHTML='';iceEl.innerHTML='';for(let r=0;r<N;r++)for(let c=0;c<N;c++){const d=document.createElement('div');d.className='cell'+((r+c)%2?' b':'');cellsEl.appendChild(d);const i=document.createElement('div');i.className='ice';iceEl.appendChild(i);updateCell(r,c)}}
function updateCell(r,c){const d=cellsEl.children[r*N+c],j=G.jelly[r][c];d.classList.toggle('j1',j===1);d.classList.toggle('j2',j===2);iceEl.children[r*N+c].className='ice'+(G.ice[r][c]?' i'+G.ice[r][c]:'')}
function gIcon(g){return g.t==='jelly'?'<span class="gi"><i class="gi gi-j"></i></span>':g.t==='ice'?'<span class="gi"><i class="gi gi-i"></i></span>':g.t==='score'?'<span class="gi">'+STAR('on')+'</span>':'<span class="gi">'+FR[g.f]+'</span>'}
function gText(g){return g.t==='jelly'?`Clear ${g.need} jelly`:g.t==='ice'?`Break ${g.need} ice`:g.t==='score'?`Score ${fmt(g.need)} points`:`Collect ${g.need} ${NM[g.f]}`}
function hud(bumped){
  $('#hLv').textContent=L.n;$('#hMoves').textContent=G.moves;$('#hMv').classList.toggle('warn',G.moves<=5&&!G.over);$('#hScore').textContent=fmt(G.score);
  const max=L.s3*1.06;$('#hBar').style.width=Math.min(100,G.score/max*100)+'%';
  [L.s1,L.s2,L.s3].forEach((s,i)=>{const m=$('#mk'+(i+1));m.style.left=(s/max*100)+'%';m.innerHTML=STAR(G.score>=s?'on':'')});
  $('#hGoals').innerHTML=L.goals.map(g=>{const left=Math.max(0,g.need-prog(g)),ok=left===0;
    const bump=bumped&&g.t==='collect'&&bumped.has(g.f)&&!ok?' bump':'';
    return`<div class="gchip${ok?' ok':''}${bump}">${gIcon(g)}<span>${ok?TICK:g.t==='score'?fmt(g.need):left}</span></div>`}).join('')}
function layout(){
  const st=$('#stage');const w=st.clientWidth-20-16,h=st.clientHeight-20-16;
  cell=Math.max(28,Math.min(78,Math.floor(Math.min(w,h)/N)));document.documentElement.style.setProperty('--cell',cell+'px');
  if(G)G.grid.forEach((row,r)=>row.forEach((p,c)=>{if(p)pos(p,r,c,0)}))}

function startLevel(n){
  closeModal();clearHint();setSel(null);curN=n;L=genLevel(n);
  G={moves:L.moves,score:0,coll:{},jelly:L.jelly.map(r=>r.slice()),ice:L.ice.map(r=>r.slice()),grid:g0().map(r=>r.map(()=>null)),busy:true,chain:0,extra:false,swap:null,reached:false,over:false};
  tilesEl.innerHTML='';fxEl.innerHTML='';
  let ok=false;for(let t=0;t<80&&!ok;t++){for(let r=0;r<N;r++)for(let c=0;c<N;c++){let f,g=0;do{f=rc()}while(g++<30&&((c>=2&&G.grid[r][c-1].f===f&&G.grid[r][c-2].f===f)||(r>=2&&G.grid[r-1][c].f===f&&G.grid[r-2][c].f===f)));G.grid[r][c]={f,s:''}}ok=findMoves().length>0}
  for(let r=0;r<N;r++)for(let c=0;c<N;c++)G.grid[r][c]=mk(G.grid[r][c].f);
  buildCells();show('game');layout();hud();
  for(let r=0;r<N;r++)for(let c=0;c<N;c++)pos(G.grid[r][c],r-N-1,c,0);
  void tilesEl.offsetWidth;
  for(let r=0;r<N;r++)for(let c=0;c<N;c++)pos(G.grid[r][c],r,c,420+(N-r)*45+c*18);
  setTimeout(()=>{if(G&&!G.over){G.busy=false;armHint()}},1000*SPEED)}

/* ---------- input ---------- */
let ptr=null;
function setSel(p){if(sel&&sel.el)sel.el.classList.remove('sel');sel=p;if(p)p.el.classList.add('sel')}
function cellAt(e){const b=tilesEl.getBoundingClientRect();return[Math.floor((e.clientY-b.top)/cell),Math.floor((e.clientX-b.left)/cell)]}
boardEl.addEventListener('pointerdown',e=>{A.init();if(!G||G.busy||G.over)return;const[r,c]=cellAt(e);if(!inB(r,c))return;
  ptr={r,c,x:e.clientX,y:e.clientY,id:e.pointerId,moved:false};try{boardEl.setPointerCapture(e.pointerId)}catch(_){}clearHint();e.preventDefault()});
boardEl.addEventListener('pointermove',e=>{if(!ptr||ptr.moved||e.pointerId!==ptr.id)return;const dx=e.clientX-ptr.x,dy=e.clientY-ptr.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<cell*.3)return;ptr.moved=true;
  const[dr,dc]=Math.abs(dx)>Math.abs(dy)?[0,Math.sign(dx)]:[Math.sign(dy),0];trySwap(ptr.r,ptr.c,ptr.r+dr,ptr.c+dc)});
const endPtr=e=>{if(!ptr||e.pointerId!==ptr.id)return;const p=ptr;ptr=null;if(p.moved||e.type==='pointercancel')return armHint();
  if(!G||G.busy||G.over)return;const t=G.grid[p.r][p.c];
  if(sel&&sel!==t&&Math.abs(sel.r-p.r)+Math.abs(sel.c-p.c)===1){const s=sel;trySwap(s.r,s.c,p.r,p.c);return}
  if(sel===t)setSel(null);else{setSel(t);S.click()}armHint()};
boardEl.addEventListener('pointerup',endPtr);boardEl.addEventListener('pointercancel',endPtr);

/* ---------- hints ---------- */
function armHint(){clearTimeout(hintT);hintT=setTimeout(showHint,5000)}
function clearHint(){clearTimeout(hintT);hintEls.forEach(e=>e.classList.remove('hint'));hintEls=[]}
function showHint(){if(!G||G.busy||G.over||$('#modal').classList.contains('on')||!$('#game').classList.contains('on'))return;
  const ms=findMoves();if(!ms.length)return;ms.sort((a,b)=>rateMove(b)-rateMove(a));const m=ms[Math.floor(Math.random()*Math.min(3,ms.length))];
  const a=G.grid[m[0]][m[1]],b=G.grid[m[2]][m[3]],dx=(m[3]-m[1])*cell*.14,dy=(m[2]-m[0])*cell*.14;
  a.el.style.setProperty('--hx',dx+'px');a.el.style.setProperty('--hy',dy+'px');b.el.style.setProperty('--hx',-dx+'px');b.el.style.setProperty('--hy',-dy+'px');
  hintEls=[a.el,b.el];hintEls.forEach(e=>e.classList.add('hint'))}

/* ---------- screens, map, modals ---------- */
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));if(id==='map')renderMap();if(id!=='game')clearHint()}
function modal(h){const m=$('#modal');m.innerHTML='<div class="card">'+h+'</div>';m.classList.add('on')}
function closeModal(){$('#modal').classList.remove('on')}
const TIPS={1:'Swipe a fruit toward a neighbour, or tap one and then the other, to line up 3 or more of the same fruit.',
  2:'Match 4 for a striped fruit (clears a line), an L or T shape for a wrapped fruit (explodes twice), and 5 in a row for a rainbow orb. Swap two specials together for a mega combo!',
  3:'Pink jelly sits under the fruit. Make matches on top of it to clear it. Darker jelly needs two hits.',
  5:'Frozen fruit can’t be moved. Match it, or match right next to it, to crack the ice. Thick ice needs two hits.',
  8:'Jelly and ice together! Specials and combos are your best friends here.'};
function intro(n){
  if(n>save.unlocked){S.bad();return}curN=n;const Lv=genLevel(n),best=save.stars[n]||0;
  modal(`<h2>Level ${n}</h2><div class="bigstars" style="font-size:34px">${[0,1,2].map(i=>STAR(i<best?'on':'')).join('')}</div>
    <div class="glist">${Lv.goals.map(g=>`<div class="gline">${gIcon(g)}<span>${gText(g)}</span></div>`).join('')}</div>
    <p><b>${Lv.moves}</b> moves${Lv.type==='score'?'':' · leftover moves become an Orchard Bonus'}</p>
    ${TIPS[n]?`<p class="tip">${TIPS[n]}</p>`:''}
    <div class="btns"><button class="btn" data-act="go" style="min-width:180px">Play</button><button class="link" data-act="close">Not now</button></div>`)}
function renderMap(){
  const inner=$('#mapInner'),sc=$('#mapScroll'),W=Math.min(sc.clientWidth,520)||360,count=Math.max(save.unlocked+6,14),gap=108,H=count*gap+150;
  const R=mulberry32(7),pts=[];for(let i=1;i<=count;i++)pts.push([W/2+Math.sin(i*.9)*Math.min(W*.3,150),H-90-(i-1)*gap]);
  let d=`M${pts[0][0]} ${pts[0][1]+80}L${pts[0][0]} ${pts[0][1]}`;for(let i=1;i<pts.length;i++){const[a,b]=pts[i-1],[x,y]=pts[i];d+=`C${a} ${b-gap/2} ${x} ${y+gap/2} ${x} ${y}`}
  let deco='';pts.forEach(([x,y],i)=>{const side=x<W/2?1:-1,tx=W/2+side*W*(.3+R()*.12),ty=y+R()*40-20,s=.55+R()*.35;
    deco+=i%2?`<g transform="translate(${tx} ${ty}) scale(${s})"><rect x="-5" y="0" width="10" height="34" rx="4" style="fill:var(--trunk)"/><circle cy="-8" r="24" style="fill:var(--leaf)"/><circle cx="-14" cy="4" r="16" style="fill:var(--leaf)"/><circle cx="14" cy="4" r="16" style="fill:var(--leaf)"/><circle cx="-8" cy="-12" r="4" fill="${FC[i%6]}"/><circle cx="9" cy="0" r="4" fill="${FC[(i+2)%6]}"/></g>`
      :`<g transform="translate(${tx} ${ty})">${[0,1,2].map(j=>`<circle cx="${j*14-14}" cy="${(j%2)*8}" r="5" fill="${['#fff','#ffd21a','#ff8fb1'][j]}"/><circle cx="${j*14-14}" cy="${(j%2)*8}" r="2" fill="#f5a300"/>`).join('')}</g>`});
  const nodes=pts.map(([x,y],i)=>{const n=i+1,st=save.stars[n]||0,lock=n>save.unlocked,cls=lock?'lock':st?'done':'';
    return`<button class="node ${cls}${n===save.unlocked?' cur':''}" style="left:${x}px;top:${y}px" data-act="lvl" data-n="${n}" aria-label="Level ${n}${lock?' (locked)':''}">${lock?'<svg class="lk" viewBox="0 0 24 24"><path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z"/></svg>':n}${lock?'':`<span class="ns">${[0,1,2].map(j=>STAR(j<st?'on':'')).join('')}</span>`}</button>`}).join('');
  inner.style.height=H+'px';inner.style.width=W+'px';
  inner.innerHTML=`<svg class="path" viewBox="0 0 ${W} ${H}">${deco}<path d="${d}" fill="none" stroke="rgba(120,70,20,.25)" stroke-width="30" stroke-linecap="round" transform="translate(0 4)"/><path d="${d}" fill="none" stroke="#e9c98f" stroke-width="26" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#fff6dc" stroke-width="4" stroke-dasharray="2 14" stroke-linecap="round"/></svg>${nodes}`;
  $('#mStars').textContent=Object.values(save.stars).reduce((a,b)=>a+b,0);
  const cy=pts[Math.min(save.unlocked,count)-1][1];sc.scrollTop=Math.max(0,cy-sc.clientHeight*.62)}
function sndIcons(){document.querySelectorAll('.snd').forEach(b=>{b.innerHTML=`<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${save.muted?'<path d="M16 9.5l5 5M21 9.5l-5 5"/>':'<path d="M15.5 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/>'}</svg>`;b.setAttribute('aria-pressed',String(!save.muted))})}
function tag(){const t=Object.values(save.stars).reduce((a,b)=>a+b,0);$('#tTag').textContent=save.unlocked>1?`Level ${save.unlocked} · ${t} stars collected`:'Swipe or tap to swap fruit'}

document.addEventListener('pointerdown',()=>A.init(),{passive:true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;A.init();const a=b.dataset.act;if(a!=='sound')S.click();
  switch(a){
    case'toMap':show('map');break;
    case'home':tag();show('title');break;
    case'lvl':intro(+b.dataset.n);break;
    case'go':startLevel(curN);break;
    case'close':closeModal();if(G&&!G.over&&$('#game').classList.contains('on'))armHint();break;
    case'pause':if(!G)return;clearHint();modal(`<h2>Paused</h2><p>Level ${L.n} · ${G.moves} moves left</p><div class="btns"><button class="btn" data-act="close">Resume</button><button class="btn alt sm" data-act="retry">Restart level</button><button class="link" data-act="map">Back to map</button></div>`);break;
    case'retry':startLevel(L.n);break;
    case'map':closeModal();G&&(G.over=true);show('map');break;
    case'next':closeModal();show('map');intro(L.n+1);break;
    case'extra':G.extra=true;G.moves+=5;G.over=false;closeModal();hud();toast('+5 moves — you’ve got this!');
      if(!findMoves().length)shuffle().then(()=>{G.busy=false;armHint()});else{G.busy=false;armHint()}break;
    case'install':install();break;
    case'sound':save.muted=!save.muted;persist();sndIcons();if(!save.muted)S.click();break;
  }});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('#modal').classList.contains('on')&&$('#modal [data-act=close]'))$('#modal [data-act=close]').click()});
let rT=0;addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>{if($('#game').classList.contains('on'))layout();if($('#map').classList.contains('on'))renderMap()},120)});
document.addEventListener('gesturestart',e=>e.preventDefault());
sndIcons();tag();

/* ---------- PWA: service worker + install ---------- */
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const instBtn=$('#installBtn');let installEvt=null;
const offerInstall=()=>{instBtn.hidden=standalone||!(installEvt||isIOS)};
addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;offerInstall()});
addEventListener('appinstalled',()=>{installEvt=null;instBtn.hidden=true});
offerInstall();
async function install(){
  if(installEvt){installEvt.prompt();try{await installEvt.userChoice}catch(_){}installEvt=null;offerInstall();return}
  const share='<svg class="ishare" viewBox="0 0 24 24"><path d="M12 3v12M8 7l4-4 4 4M6 11H5v10h14V11h-1"/></svg>';
  modal(`<h2>Install Orchard Pop</h2><p>Add the game to your Home Screen to play full-screen, even offline:</p>
    <ol class="steps"><li>Tap the Share button ${share} in Safari</li><li>Choose <b>Add to Home Screen</b></li><li>Tap <b>Add</b></li></ol>
    <div class="btns"><button class="btn" data-act="close">Got it</button></div>`)}
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

window.__op={setSpeed:s=>SPEED=s,genLevel,startLevel,findMoves,rateMove,trySwap,L:()=>L,G:()=>G,save:()=>save};
}
