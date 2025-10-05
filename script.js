/* Sequence:
 - Warmup 3 min cyclette (work)
 - Sollevamento gamba sx con cuscino: 30s work + 15s rest x12
 - Sollevamento gamba sx - serie breve: 20s work + 10s rest x12
 - Wall squat gamba singola sx: 30s work + 20s rest x10
 - Cyclette defaticamento: 5min work + 1min rest x2
*/
const beep = document.getElementById('beep');
const sequenceDiv = document.getElementById('sequence');
const phaseDiv = document.getElementById('phase');
const timerDiv = document.getElementById('timer');
const labelDiv = document.getElementById('label');
const currentBox = document.getElementById('current-box');
const progressDiv = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
let sequence = [];
function pushBlock(title, workSec, restSec, reps){
  for(let i=0;i<reps;i++){
    sequence.push({title:title, duration:workSec, type:'work', rep:i+1, totalRep:reps});
    if(restSec>0) sequence.push({title:title, duration:restSec, type:'rest', rep:i+1, totalRep:reps});
  }
}
sequence.push({title:'Cyclette (riscaldamento)', duration:3*60, type:'work'});
pushBlock('Sollevamento gamba sx con cuscino',30,15,12);
pushBlock('Sollevamento gamba sx - serie breve',20,10,12);
pushBlock('Wall squat gamba singola (sx)',30,20,10);
pushBlock('Cyclette (defaticamento)',5*60,60,2);
let idx=0;
let secondsLeft = sequence.length>0 ? sequence[0].duration : 0;
let timer=null;
let running=false;
function renderSequenceList(){ sequenceDiv.innerHTML=''; sequence.forEach((s,i)=>{ const el=document.createElement('div'); el.className='item'+(i===idx?' current':''); let txt=(i+1)+'. '+s.title+' — '+(s.type==='work'?'Lavoro':'Recupero'); if(s.rep) txt += ' (rep '+s.rep+'/'+(s.totalRep||'')+')'; el.textContent=txt; sequenceDiv.appendChild(el); });}
function playBeep(){ try{ beep.volume=1.0; beep.currentTime=0; beep.play(); }catch(e){ console.log('Audio blocked', e); } }
function updateUI(){ if(idx>=sequence.length){ phaseDiv.textContent='Sessione completata'; timerDiv.textContent='00:00'; labelDiv.textContent=''; currentBox.classList.remove('work'); currentBox.classList.remove('rest'); running=false; startBtn.disabled=false; pauseBtn.disabled=true; return; } const cur = sequence[idx]; phaseDiv.textContent = cur.type==='work' ? 'LAVORO' : 'RECUPERO'; timerDiv.textContent = formatTime(secondsLeft); labelDiv.textContent = cur.title + (cur.rep ? ' — rep '+cur.rep+'/'+cur.totalRep : ''); currentBox.classList.toggle('work', cur.type==='work'); currentBox.classList.toggle('rest', cur.type==='rest'); renderSequenceList(); progressDiv.textContent = (idx+1) + ' / ' + sequence.length; }
function formatTime(s){ const m=Math.floor(s/60); const sec=s%60; return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
function tick(){ if(secondsLeft>0){ secondsLeft--; updateUI(); } else { playBeep(); idx++; if(idx<sequence.length) secondsLeft = sequence[idx].duration; else secondsLeft=0; updateUI(); } }
startBtn.addEventListener('click', ()=>{ if(idx>=sequence.length){ idx=0; secondsLeft = sequence.length>0 ? sequence[0].duration : 0; } if(!running){ timer=setInterval(tick,1000); running=true; startBtn.disabled=true; pauseBtn.disabled=false; } playBeep(); });
pauseBtn.addEventListener('click', ()=>{ if(running){ clearInterval(timer); running=false; startBtn.disabled=false; pauseBtn.disabled=true; }});
resetBtn.addEventListener('click', ()=>{ clearInterval(timer); running=false; idx=0; secondsLeft = sequence.length>0 ? sequence[0].duration : 0; startBtn.disabled=false; pauseBtn.disabled=true; updateUI(); });
skipBtn.addEventListener('click', ()=>{ clearInterval(timer); running=false; idx++; if(idx<sequence.length) secondsLeft = sequence[idx].duration; else secondsLeft=0; startBtn.disabled=false; pauseBtn.disabled=true; updateUI(); });
updateUI();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js').catch(e=>console.log('SW failed',e)); }
