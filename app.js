// ===== Settings =====
// GIFs work out of the box (public keys). For more reliable GIF search, paste a FREE Giphy key from developers.giphy.com
const GIPHY_KEY = '';
// Needed when the two devices are on different networks (e.g. WiFi + mobile data). Free signup at metered.ca:
// paste your app name (the part before .metered.live) and your API key. See README.txt.
const METERED_APP = '', METERED_KEY = '';
const STUN=[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}];
const ICE = {iceServers:[...STUN,
 {urls:'turn:openrelay.metered.ca:80',username:'openrelayproject',credential:'openrelayproject'},
 {urls:'turn:openrelay.metered.ca:443?transport=tcp',username:'openrelayproject',credential:'openrelayproject'}]};
async function loadIce(){if(!METERED_APP||!METERED_KEY)return;try{const r=await(await fetch(`https://${METERED_APP}.metered.live/api/v1/turn/credentials?apiKey=${METERED_KEY}`)).json();if(Array.isArray(r)&&r.length)ICE.iceServers=[...STUN,...r]}catch{}}
const $=s=>document.querySelector(s);
let peer,conn,host=false,name,room,RID,friend='friend',lastDay='';

// ===== anime night-city background =====
const cv=$('#bg'),cx=cv.getContext('2d');
function paint(){
 const W=cv.width=innerWidth,H=cv.height=innerHeight;let s=7;const r=()=>(s=s*16807%2147483647)/2147483647;
 let g=cx.createLinearGradient(0,0,0,H);[[0,'#0d0630'],[.35,'#2b1068'],[.6,'#a23a9a'],[.8,'#ff7e8a'],[1,'#ffc58a']].forEach(([o,c])=>g.addColorStop(o,c));
 cx.fillStyle=g;cx.fillRect(0,0,W,H);cx.fillStyle='#fff';
 for(let i=0;i<170;i++){cx.globalAlpha=r()*.8;const z=r()<.1?2.6:1.2;cx.fillRect(r()*W,r()*H*.6,z,z)}
 cx.globalAlpha=1;
 const mx=W*.74,my=H*.24,mr=Math.min(W,H)*.1;
 g=cx.createRadialGradient(mx,my,mr*.7,mx,my,mr*4.5);g.addColorStop(0,'rgba(255,225,250,.6)');g.addColorStop(1,'rgba(255,225,250,0)');cx.fillStyle=g;cx.fillRect(0,0,W,H);
 cx.fillStyle='#fff6fb';cx.beginPath();cx.arc(mx,my,mr,0,7);cx.fill();
 cx.fillStyle='rgba(215,185,230,.5)';[[.3,-.2,.18],[-.3,.25,.25],[.1,.45,.12]].forEach(([a,b,c])=>{cx.beginPath();cx.arc(mx+a*mr,my+b*mr,c*mr,0,7);cx.fill()});
 for(let i=0;i<14;i++){const x=r()*W,y=H*(.42+r()*.32),w=140+r()*280,c=i%2?'255,150,200':'255,215,190';
  g=cx.createRadialGradient(x,y,0,x,y,w);g.addColorStop(0,`rgba(${c},.6)`);g.addColorStop(1,`rgba(${c},0)`);
  cx.save();cx.translate(x,y);cx.scale(1,.26);cx.translate(-x,-y);cx.fillStyle=g;cx.fillRect(x-w,y-w,w*2,w*2);cx.restore()}
 [['#3a1a63',.3],['#1d0e40',.21],['#0a0620',.13]].forEach(([c,k],L)=>{let x=-20;
  while(x<W){const w=24+r()*48,h=H*k*(.4+r()*.9);cx.fillStyle=c;cx.fillRect(x,H-h,w,h);
   if(L)for(let wy=H-h+8;wy<H-8;wy+=14)for(let wx=x+5;wx<x+w-6;wx+=10)if(r()<.16){cx.fillStyle=r()<.5?'#ffd98a':'#9ee7ff';cx.fillRect(wx,wy,4,6)}
   x+=w+r()*6}});
 cx.strokeStyle='#0a0620';cx.lineWidth=1.5;
 for(let i=0;i<4;i++){cx.beginPath();cx.moveTo(0,H*(.5+i*.04));cx.quadraticCurveTo(W/2,H*(.62+i*.05),W,H*(.48+i*.04));cx.stroke()}
}
paint();addEventListener('resize',paint);
for(let i=0;i<16;i++){const p=document.createElement('i');p.textContent='✿';p.style.cssText=`left:${Math.random()*100}vw;font-size:${10+Math.random()*16}px;animation-duration:${9+Math.random()*10}s;animation-delay:-${Math.random()*15}s;opacity:${.5+Math.random()*.5}`;$('#petals').append(p)}

// ===== history (IndexedDB) =====
const db=new Promise(res=>{const q=indexedDB.open('sakura',1);q.onupgradeneeded=()=>q.result.createObjectStore('m',{keyPath:'id',autoIncrement:true}).createIndex('r','room');q.onsuccess=()=>res(q.result);q.onerror=()=>res(null)});
async function save(m,mine){try{const d=await db;d&&d.transaction('m','readwrite').objectStore('m').add({...m,room,mine,ts:Date.now()})}catch{}}
async function load(){try{const d=await db;return d?await new Promise(r=>{d.transaction('m').objectStore('m').index('r').getAll(room).onsuccess=e=>r(e.target.result)}):[]}catch{return[]}}
async function wipe(){const d=await db;d.transaction('m','readwrite').objectStore('m').index('r').openCursor(room).onsuccess=e=>{const c=e.target.result;if(c){c.delete();c.continue()}};$('#msgs').innerHTML='';lastDay=''}

// ===== join & connection =====
$('#name').value=localStorage.cn||'';$('#room').value=localStorage.cr||'';
$('#go').onclick=async()=>{
 name=$('#name').value.trim()||'friend';room=$('#room').value.trim().toLowerCase().replace(/\W+/g,'');
 if(!room)return $('#room').focus();
 localStorage.cn=name;localStorage.cr=$('#room').value;RID='sakurachat-'+room;
 $('#join').hidden=true;$('#chatwrap').hidden=false;
 (await load()).forEach(r=>add(r,r.mine,r.ts));
 await loadIce();mk(RID);
};
function mk(id){
 const p=new Peer(id,{config:ICE});peer=p;stat('opening room…');
 p.on('open',()=>{if(id){host=true;if(!(conn&&conn.open))stat('waiting for your friend ✿')}else join()});
 p.on('connection',setup);p.on('call',onCall);
 p.on('disconnected',()=>{try{p.reconnect()}catch{}});
 p.on('error',e=>{
  if(e.type==='unavailable-id'){host=false;mk()}
  else if(e.type==='peer-unavailable'){stat('friend not online yet…');setTimeout(join,3000)}
  else stat('connection problem ('+e.type+')')});
}
const join=()=>{if(conn&&conn.open)return;setup(peer.connect(RID,{reliable:true}))};
function setup(c){
 const old=conn;conn=c;if(old&&old!==c&&old.open)old.close();
 c.on('open',()=>{c.send({t:'hi',n:name});linkInfo(c)});
 c.on('data',onData);
 c.on('close',()=>{if(conn!==c)return;stat('friend left… waiting',0);endWatch();if(!host)setTimeout(join,3000)});
 c.on('error',()=>{});
 setTimeout(()=>{if(conn===c&&!c.open)stat("can't link yet: same room code on both? see README (TURN)",0)},15000);
}
function linkInfo(c){stat('connected ♥',1);try{c.peerConnection.getStats().then(rs=>{rs.forEach(r=>{if(r.type==='candidate-pair'&&r.nominated&&r.state==='succeeded'){const l=rs.get(r.localCandidateId);if(l)stat('connected ♥ ('+(l.candidateType==='relay'?'relay':'direct')+')',1)}})})}catch{}}
function stat(t,ok){$('#stat').textContent=t;$('#dot').className=ok?'ok':''}
const send=o=>{if(conn&&conn.open){conn.send(o);return true}stat('not connected yet');return false};

// ===== messages =====
const M=$('#msgs');
function add(m,mine,ts=Date.now()){
 const dt=new Date(ts),day=dt.toDateString();
 if(day!==lastDay){lastDay=day;const x=document.createElement('div');x.className='day';x.textContent=dt.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'});M.append(x)}
 const d=document.createElement('div');d.className='m'+(mine?' me':'');if(m.id)d.dataset.id=m.id;
 const n=document.createElement('small');n.textContent=(m.who||'?')+' · '+dt.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});d.append(n);
 if(m.t==='msg')d.append(m.text);
 if(m.t==='sticker'){d.classList.add('stk');const s=document.createElement('span');s.textContent=m.s;if(m.c==='p'){s.className='card';s.style.setProperty('--h',m.h)}if(m.a)s.classList.add('a-'+m.a);d.append(s)}
 if(m.t==='img'||m.t==='gif'){const i=new Image();i.src=m.data||m.url;i.onload=()=>M.scrollTop=1e9;d.append(i)}
 if(m.t==='voice'){const a=document.createElement('audio');a.controls=true;a.src=URL.createObjectURL(new Blob([m.buf],{type:m.mime}));d.append(a)}
 M.append(d);M.scrollTop=1e9;
}
function onData(m){
 if(m.t==='hi'){friend=m.n;return}
 if(m.t==='ack'){const x=document.querySelector(`[data-id="${m.id}"] small`);if(x&&!x.dataset.k){x.dataset.k=1;x.append(' ✓✓')}return}
 if(m.t==='g'){onGame(m);return}
 if(m.id)send({t:'ack',id:m.id});
 add(m,false);save(m,false);
}
function out(m){m.who=name;m.id=Date.now()+''+Math.floor(Math.random()*999);if(!send(m))return;add(m,true);save(m,true)}
$('#bSend').onclick=()=>{const v=$('#txt').value.trim();if(v){out({t:'msg',text:v});$('#txt').value=''}};
$('#txt').onkeydown=e=>{if(e.key==='Enter')$('#bSend').click()};
$('#bClear').onclick=()=>{if(confirm('Delete the chat history on this device?'))wipe()};

// ===== pickers: emoji, stickers, GIFs =====
const EMOJI='😀😃😄😁😆😅😂🤣🥲☺️😊😇🙂😉😍🥰😘😋😛😜🤪🤗🤭🤔🫡😏😒🙄😬😮‍💨😌😔😪😴😷🤒🥵🥶🥴😵🤯🤠🥳😎🤓😕😟🙁😮😲😳🥺😦😨😰😢😭😱😖😣😞😓😩😫🥱😤😡🤬😈👿💀☠️👻👽🤖💩🙈🙉🙊💋💌💘💝💖💗💓💞💕💔❤️🧡💛💚💙💜🖤🤍💯💢💥💫💦💨🕊️👋🤚✋🖖👌🤌✌️🤞🫰🤟🤘🤙👍👎✊👊👏🙌🫶🙏💪🌸🌺🌷🌹🍀🌙⭐🌟✨⚡🔥🌈☀️❄️🍓🍑🍒🍉🍡🍣🍜🍙🍰🧁🍩🍫🍿🧋☕🎂🎉🎊🎁🎀🎮🎧🎤🎬🎵🐱🐶🐰🦊🐻🐼🐨🐯🦁🐸🐧🐣🦄🐙'.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu);
const KAO=['(≧◡≦)','(╥﹏╥)','٩(◕‿◕)۶','(ง •̀_•́)ง','(¬_¬)','(つ✧ω✧)つ','ヽ(>∀<☆)ノ','(´• ω •`)','(҂◡_◡)','(´∩｡• ᵕ •｡∩`)','(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)','(｡•̀ᴗ-)✧','ᕕ( ᐛ )ᕗ','(ノಠ益ಠ)ノ彡┻━┻','(︶｡︶)zzZ','(＞﹏＜)','(๑˃ᴗ˂)ﻭ','(ﾉ´ヮ`)ﾉ*:･ﾟ✧','(눈_눈)','(•̀ᴗ•́)و','(ღ˘⌣˘ღ)','( ´･･)ﾉ(._.`)'];
const JP=['ありがとう!','やった!','おやすみ~','だいすき!','ごめんね','がんばれ!','すごい!','えーっ?!','おなかすいた','ねむい…','うれしい!','はずかしい…','ばか!','まってる~','おつかれさま!','よろしく!','かわいい!','ふぁいと!'];
const ANI=[['💖','pulse'],['😂','shake'],['🔥','flick'],['🌸','spin'],['👻','float'],['⭐','twinkle'],['🥺','pulse'],['😭','shake'],['😍','pulse'],['🎉','shake'],['🐱','float'],['🦊','float'],['🍜','shake'],['🌙','float'],['💀','shake'],['🫶','pulse'],['😡','flick'],['🥳','shake'],['💫','spin'],['🍡','float']];
const CHIPS=['trending','anime hug','anime happy','anime cry','anime blush','anime dance','anime angry','anime love','anime sleepy','anime wave'];
let open='',pack='jp';
const P=$('#panel');
function tog(k,fn){open=open===k?'':k;P.hidden=!open;P.innerHTML='';if(open)fn()}
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e};
$('#bEmo').onclick=()=>tog('e',()=>EMOJI.forEach(e=>{const b=el('button','e',e);b.onclick=()=>{$('#txt').value+=e;$('#txt').focus()};P.append(b)}));
function stickers(){
 P.innerHTML='';const t=el('div','tabs');[['jp','Words'],['kao','Kaomoji'],['ani','Animated']].forEach(([k,n])=>{const b=el('button',k===pack?'on':'',n);b.onclick=()=>{pack=k;stickers()};t.append(b)});P.append(t);
 if(pack==='jp')JP.forEach((s,i)=>{const h=(i*47+330)%360,b=el('button','p',s);b.style.setProperty('--h',h);b.onclick=()=>out({t:'sticker',s,c:'p',h});P.append(b)});
 if(pack==='kao')KAO.forEach(s=>{const b=el('button','e',s);b.style.fontSize='16px';b.onclick=()=>out({t:'sticker',s});P.append(b)});
 if(pack==='ani')ANI.forEach(([s,a])=>{const b=el('button','e',s);b.firstChild.parentNode.classList.add('a-'+a);b.onclick=()=>out({t:'sticker',s,a});P.append(b)});
}
$('#bStk').onclick=()=>tog('s',stickers);
async function gifFetch(q){
 const k=GIPHY_KEY||'dc6zaTOxFJmzC';
 const tries=[async()=>{const u=q?`https://api.giphy.com/v1/gifs/search?api_key=${k}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`:`https://api.giphy.com/v1/gifs/trending?api_key=${k}&limit=24&rating=pg-13`;
   const r=await(await fetch(u)).json();if(!r.data||!r.data.length)throw 0;return r.data.map(x=>[x.images.fixed_width.url,x.images.fixed_width.url])},
  async()=>{const u=q?`https://g.tenor.com/v1/search?q=${encodeURIComponent(q)}&key=LIVDSRZULELA&limit=24`:`https://g.tenor.com/v1/trending?key=LIVDSRZULELA&limit=24`;
   const r=await(await fetch(u)).json();if(!r.results||!r.results.length)throw 0;return r.results.map(x=>[x.media[0].tinygif.url,x.media[0].gif.url])}];
 for(const f of tries){try{return await f()}catch{}}return null;
}
$('#bGif').onclick=()=>tog('g',()=>{
 const i=el('input');i.placeholder='search GIFs, or paste a GIF link';
 const t=el('div','tabs'),g=el('div','gifs');P.append(i,t,g);
 const run=async q=>{g.innerHTML='<p class="mu">loading…</p>';const r=await gifFetch(q);g.innerHTML='';
  if(!r){g.innerHTML='<p class="mu">GIF search is busy right now. Paste a GIF link above, or add a free Giphy key in app.js.</p>';return}
  r.forEach(([a,b])=>{const im=new Image();im.src=a;im.loading='lazy';im.onclick=()=>{out({t:'gif',url:b});tog('g')};g.append(im)})};
 CHIPS.forEach(c=>{const b=el('button','',c);b.onclick=()=>run(c==='trending'?'':c);t.append(b)});
 i.onkeydown=e=>{if(e.key!=='Enter')return;const q=i.value.trim();if(!q)return;if(/^https?:/.test(q)){out({t:'gif',url:q});tog('g')}else run(q)};
 run('anime reaction');
});

// ===== pictures =====
$('#bImg').onclick=()=>$('#file').click();
$('#file').onchange=e=>{
 const f=e.target.files[0];if(!f)return;e.target.value='';const r=new FileReader();
 r.onload=()=>{
  if(f.type==='image/gif'){if(f.size>3e6)return alert('GIF too big (max 3MB)');return out({t:'img',data:r.result})}
  const im=new Image();im.onload=()=>{const k=Math.min(1,1200/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);out({t:'img',data:c.toDataURL('image/jpeg',.82)})};im.src=r.result};
 r.readAsDataURL(f);
};

// ===== voice notes (hold the mic) =====
let rec,chunks;const mic=$('#bMic');
mic.onpointerdown=async e=>{
 e.preventDefault();
 try{const s=await navigator.mediaDevices.getUserMedia({audio:true});rec=new MediaRecorder(s);chunks=[];
  rec.ondataavailable=x=>chunks.push(x.data);
  rec.onstop=async()=>{s.getTracks().forEach(t=>t.stop());mic.classList.remove('rec');const b=new Blob(chunks,{type:rec.mimeType});if(b.size>800)out({t:'voice',buf:await b.arrayBuffer(),mime:rec.mimeType})};
  rec.start();mic.classList.add('rec')}catch{alert('Allow microphone access to send voice notes')}
};
['pointerup','pointerleave','pointercancel'].forEach(v=>mic.addEventListener(v,()=>{if(rec&&rec.state==='recording')rec.stop()}));

// ===== calls: screen share (movie night) + live voice =====
let pending={},sharing,talk,micS;
function note(t,b,f){const n=$('#note');n.hidden=!t;n.innerHTML='';if(!t)return;n.append(t);if(b){const x=el('button','',b);x.onclick=f;n.append(x)}}
function onCall(c){
 const k=(c.metadata&&c.metadata.k)||'screen';pending[k]=c;
 c.on('close',()=>{k==='screen'?endWatch():endTalk();note('')});
 note(k==='screen'?'📺 Your friend is sharing their screen':'🎧 Your friend started voice chat',k==='screen'?'Watch':'Join',()=>accept(k));
}
async function accept(k){ // runs from a tap, so the browser allows sound
 const c=pending[k];if(!c)return;note('');
 if(k==='screen'){
  c.on('stream',s=>{$('#v').srcObject=s;$('#stage').hidden=false;$('#app').classList.add('watching');$('#v').play().catch(()=>{})});
  c.answer();
 }else{
  try{micS=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch{}
  c.on('stream',s=>{$('#va').srcObject=s;$('#va').play().catch(()=>{})});
  c.answer(micS);talk=c;$('#bTalk').classList.add('on');
 }
}
function endWatch(){$('#v').srcObject=null;$('#stage').hidden=true;$('#app').classList.remove('watching')}
function endTalk(){if(micS)micS.getTracks().forEach(t=>t.stop());micS=null;talk=null;$('#bTalk').classList.remove('on');$('#va').srcObject=null}
$('#leave').onclick=()=>{pending.screen&&pending.screen.close();endWatch()};
$('#fs').onclick=()=>{const v=$('#v');(v.requestFullscreen||v.webkitRequestFullscreen).call(v)};
$('#bTalk').onclick=async()=>{
 if(talk){talk.close();endTalk();return}
 if(!conn||!conn.open)return alert('Wait until your friend is connected.');
 try{micS=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}catch{return alert('Allow microphone access to talk.')}
 const c=peer.call(conn.peer,micS,{metadata:{k:'voice'}});
 c.on('stream',s=>{$('#va').srcObject=s;$('#va').play().catch(()=>{})});c.on('close',endTalk);c.on('error',e=>{endTalk();note('Call failed ('+e.type+'). See README (TURN).')});
 talk=c;$('#bTalk').classList.add('on');note('🎧 Calling… your friend taps Join to talk');setTimeout(()=>note(''),5000);
};
function stopShare(){if(sharing){sharing.s.getTracks().forEach(t=>t.stop());sharing.close();sharing=null}$('#bShare').classList.remove('on');note('')}
$('#bShare').onclick=async()=>{
 if(sharing)return stopShare();
 if(!conn||!conn.open)return alert('Wait until your friend is connected.');
 if(!navigator.mediaDevices||!navigator.mediaDevices.getDisplayMedia)return alert('Screen sharing needs a desktop browser such as Chrome. Phones can watch but not share.');
 let s;
 try{s=await navigator.mediaDevices.getDisplayMedia({video:true,audio:true})}
 catch(e){try{s=await navigator.mediaDevices.getDisplayMedia({video:true})}catch{return stat('screen share cancelled',1)}}
 const c=peer.call(conn.peer,s,{metadata:{k:'screen'}});c.s=s;sharing=c;c.on('error',e=>{stopShare();note('Share failed ('+e.type+'). See README (TURN).')});
 s.getVideoTracks()[0].onended=stopShare;c.on('close',stopShare);
 $('#bShare').classList.add('on');note('📺 Sharing! Your friend taps Watch. Tip: pick "Chrome Tab" and tick "Share tab audio" for movie sound.');
};

// ===== mini games =====
const G={ttt:{b:Array(9).fill(''),t:'X',o:'',w:[],s:[0,0,0]},rps:{m:null,f:null,rv:0,s:[0,0,0]},mem:null};
let tab='ttt';const mark=()=>host?'X':'O';
const LN=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function tPlace(i){const g=G.ttt;if(g.b[i]||g.o)return;g.b[i]=g.t;const w=LN.find(l=>l.every(k=>g.b[k]===g.t));
 if(w){g.o=g.t;g.w=w;g.s[g.t===mark()?0:1]++}else if(g.b.every(Boolean)){g.o='-';g.s[2]++}g.t=g.t==='X'?'O':'X'}
function rpsCheck(){const g=G.rps;if(g.m&&g.f&&!g.rv){g.rv=1;const w={r:'s',s:'p',p:'r'};g.res=g.m===g.f?2:w[g.m]===g.f?0:1;g.s[g.res]++;setTimeout(()=>{g.rv=2;drawArc()},1100)}}
const FACE=['🌸','🍡','🐱','🌙','⭐','🍓','🦊','🎀'];
function memNew(d){if(!d){d=[...FACE,...FACE].sort(()=>Math.random()-.5);send({t:'g',g:'mem',a:'deck',d})}G.mem={d,o:[],m:[],t:'h',s:{h:0,g:0},lock:false}}
function memFlip(i,remote){const g=G.mem;if(!g||g.lock||g.m.includes(i)||g.o.includes(i))return;
 if(!remote&&g.t!==(host?'h':'g'))return;g.o.push(i);if(!remote)send({t:'g',g:'mem',a:'f',i});drawArc();
 if(g.o.length===2){g.lock=true;setTimeout(()=>{const[a,b]=g.o;if(g.d[a]===g.d[b]){g.m.push(a,b);g.s[g.t]++}else g.t=g.t==='h'?'g':'h';g.o=[];g.lock=false;drawArc()},900)}}
function onGame(m){
 $('#arcade').hidden=false;tab=m.g;
 if(m.g==='ttt'){if(m.a==='mv')tPlace(m.i);else Object.assign(G.ttt,{b:Array(9).fill(''),t:'X',o:'',w:[]})}
 if(m.g==='rps'){if(m.a==='pick'){G.rps.f=m.c;rpsCheck()}else Object.assign(G.rps,{m:null,f:null,rv:0})}
 if(m.g==='mem'){if(m.a==='deck')memNew(m.d);else memFlip(m.i,true)}
 drawArc();
}
function drawArc(){
 let h='<div class="tabs">'+[['ttt','⭕ Tic-Tac-Toe'],['rps','✊ Janken'],['mem','🃏 Memory']].map(([k,n])=>`<button data-tab="${k}" class="${k===tab?'on':''}">${n}</button>`).join('')+'</div><div class="gm">';
 const f=friend.replace(/[<>&]/g,'');
 if(tab==='ttt'){const g=G.ttt,me=mark();
  h+=`<div class="sc"><span>You ${g.s[0]}</span><span>Draw ${g.s[2]}</span><span>${f} ${g.s[1]}</span></div>`;
  h+=`<div class="st">${g.o?(g.o==='-'?'Draw!':g.o===me?'You win! ✿':f+' wins!'):(g.t===me?'Your turn':f+"'s turn…")}</div><div class="tt">`;
  g.b.forEach((c,i)=>h+=`<button class="c ${c==='X'?'x':'o'} ${g.w.includes(i)?'w':''}" data-i="${i}">${c==='X'?'✕':c==='O'?'○':''}</button>`);
  h+='</div><button class="big" data-act="tnew">New round</button>'}
 if(tab==='rps'){const g=G.rps,E={r:'✊',p:'✋',s:'✌️'};
  h+=`<div class="sc"><span>You ${g.s[0]}</span><span>Draw ${g.s[2]}</span><span>${f} ${g.s[1]}</span></div>`;
  if(g.rv===1)h+='<div class="st">じゃん・けん・ぽん!</div><div class="hands"><div class="hand sh">✊</div><div class="hand sh">✊</div></div>';
  else if(g.rv===2)h+=`<div class="st">${['You win! ✿',f+' wins!','Draw!'][g.res]}</div><div class="hands"><div class="hand">${E[g.m]}</div><div class="hand">${E[g.f]}</div></div><button class="big" data-act="rnew">Again</button>`;
  else h+=`<div class="st">${g.m?'Waiting for '+f+'…':'Pick one!'}</div><div class="hands">${g.m?`<div class="hand">${E[g.m]}</div>`:'<button data-c="r">✊</button><button data-c="p">✋</button><button data-c="s">✌️</button>'}</div>`}
 if(tab==='mem'){const g=G.mem;
  if(!g)h+='<div class="st">Match all the pairs!</div><button class="big" data-act="mnew">Start</button>';
  else{const me=host?'h':'g';h+=`<div class="sc"><span>You ${g.s[me]}</span><span>${f} ${g.s[me==='h'?'g':'h']}</span></div>`;
   h+=`<div class="st">${g.m.length===16?(g.s[me]===g.s[me==='h'?'g':'h']?'Draw!':g.s[me]>g.s[me==='h'?'g':'h']?'You win! ✿':f+' wins!'):(g.t===me?'Your turn':f+"'s turn…")}</div><div class="mem">`;
   g.d.forEach((e,i)=>{const up=g.o.includes(i)||g.m.includes(i);h+=`<button class="mc ${up?'up':''} ${g.m.includes(i)?'ok':''}" data-k="${i}">${up?e:'✿'}</button>`});
   h+='</div><button class="big" data-act="mnew">New game</button>'}}
 $('#arcBody').innerHTML=h+'</div>';
}
$('#arcBody').onclick=e=>{const b=e.target.closest('button');if(!b)return;const d=b.dataset;
 if(d.tab){tab=d.tab}
 else if(d.i!==undefined){const g=G.ttt,i=+d.i;if(g.t!==mark()||g.b[i]||g.o)return;tPlace(i);send({t:'g',g:'ttt',a:'mv',i})}
 else if(d.act==='tnew'){Object.assign(G.ttt,{b:Array(9).fill(''),t:'X',o:'',w:[]});send({t:'g',g:'ttt',a:'new'})}
 else if(d.c){G.rps.m=d.c;send({t:'g',g:'rps',a:'pick',c:d.c});rpsCheck()}
 else if(d.act==='rnew'){Object.assign(G.rps,{m:null,f:null,rv:0});send({t:'g',g:'rps',a:'new'})}
 else if(d.act==='mnew')memNew();
 else if(d.k!==undefined)memFlip(+d.k);
 drawArc()};
$('#bGame').onclick=()=>{$('#arcade').hidden=false;drawArc()};
$('#arcClose').onclick=()=>$('#arcade').hidden=true;
