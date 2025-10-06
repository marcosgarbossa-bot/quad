/*
 Final PWA behavior:
 - Timer fixed top, buttons under timer
 - Sequence includes work+rest internally, but list shows only work phases (remaining)
 - Recoveries are shown only by the timer (red) and produce beeps
 - Last exercise is "Cyclette (con sforzo)"
 - No final message; when sequence ends the list becomes empty and timer shows 00:00
*/

const beep = document.getElementById('beep');
const seqDiv = document.getElementById('sequence');
const timerLarge = document.getElementById('timer-large');
const phaseSmall = document.getElementById('phase-small');
const label = document.getElementById('label');
const progress = document.getElementById('progress');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');

// Build full sequence (work+rest)
function pushBlock(arr, title, workSec, restSec, reps){
  for(let i=0;i<reps;i++){
    arr.push({title, duration: workSec, type: 'work', rep: i+1, reps});
    if(restSec>0) arr.push({title, duration: restSec, type: 'rest', rep: i+1, reps});
  }
}

let fullSeq = [];
fullSeq.push({title: 'Cyclette (riscaldamento)', duration: 3*60, type: 'work'});
pushBlock(fullSeq, 'Sollevamento gamba sx con cuscino', 30, 15, 12);
pushBlock(fullSeq, 'Sollevamento gamba sx - serie breve', 20, 10, 12);
pushBlock(fullSeq, 'Wall squat gamba singola (sx)', 30, 20, 10);
pushBlock(fullSeq, 'Cyclette (con sforzo)', 5*60, 60, 2);

// derive array of indices for work items to render list (remaining)
function getRemainingWorkIndices(fromIdx){
  const arr = [];
  for(let i=fromIdx;i<fullSeq.length;i++){
    if(fullSeq[i].type==='work') arr.push(i);
  }
  return arr;
}

let idx = 0; // index in fullSeq (points to current segment work/rest)
let secondsLeft = fullSeq.length ? fullSeq[0].duration : 0;
let timer = null;
let running = false;

function formatTime(s){
  const m = Math.floor(s/60);
  const sec = s%60;
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function renderWorkList(){
  seqDiv.innerHTML = '';
  const indices = getRemainingWorkIndices(idx);
  indices.forEach((fullIndex, order)=>{
    const item = fullSeq[fullIndex];
    const el = document.createElement('div');
    el.className = 'item' + (fullIndex===idx ? ' current' : '');
    el.innerHTML = '<div>' + (order+1) + '. ' + item.title + (item.rep ? ' (rep ' + item.rep + '/' + item.reps + ')' : '') + '</div>'
      + '<div style="opacity:0.75;font-size:0.95rem">Lavoro</div>';
    seqDiv.appendChild(el);
  });
}

function updateTop(){
  if(idx >= fullSeq.length){
    timerLarge.textContent = '00:00';
    phaseSmall.textContent = '';
    label.textContent = '';
    document.body.style.background = '';
    renderWorkList();
    progress.textContent = '0 / 0';
    return;
  }
  const cur = fullSeq[idx];
  timerLarge.textContent = formatTime(secondsLeft);
  phaseSmall.textContent = cur.type==='work' ? 'LAVORO' : 'RECUPERO';
  label.textContent = cur.title + (cur.rep ? ' — rep ' + cur.rep + '/' + cur.reps : '');
  if(cur.type==='work'){
    timerLarge.style.color = getComputedStyle(document.documentElement).getPropertyValue('--work');
    document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg');
  } else {
    timerLarge.style.color = getComputedStyle(document.documentElement).getPropertyValue('--rest');
    document.body.style.background = 'linear-gradient(180deg, rgba(217,83,79,0.04), var(--bg))';
  }
  const totalWork = getRemainingWorkIndices(0).length;
  const remainingWork = getRemainingWorkIndices(idx).length;
  progress.textContent = (totalWork - remainingWork + 1) + ' / ' + totalWork;
  renderWorkList();
}

function playBeep(n=1){
  try{
    beep.volume = 1.0;
    beep.currentTime = 0;
    beep.play();
    if(n===2){
      setTimeout(()=>{ beep.currentTime=0; beep.play(); }, 160);
    }
  }catch(e){ console.log('audio blocked', e); }
}

function tick(){
  if(secondsLeft>0){
    secondsLeft--;
    updateTop();
  } else {
    const cur = fullSeq[idx];
    // end-of-segment beeps: double for end of work, single for end of rest
    if(cur.type==='work'){ playBeep(2); } else { playBeep(1); }
    idx++;
    if(idx < fullSeq.length){
      secondsLeft = fullSeq[idx].duration;
      // beep at start of next segment
      setTimeout(()=>playBeep(1), 120);
    } else {
      secondsLeft = 0;
      clearInterval(timer);
      running = false;
    }
    updateTop();
  }
}

function startSession(){
  if(idx >= fullSeq.length){ idx = 0; secondsLeft = fullSeq.length ? fullSeq[0].duration : 0; }
  if(!running){
    timer = setInterval(tick,1000);
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    playBeep(1); // initial beep
  }
}

function pauseSession(){
  if(running){ clearInterval(timer); running=false; startBtn.disabled=false; pauseBtn.disabled=true; }
}

function resetSession(){
  clearInterval(timer); running=false; idx=0; secondsLeft = fullSeq.length ? fullSeq[0].duration : 0;
  startBtn.disabled=false; pauseBtn.disabled=true;
  updateTop();
}

function skipSegment(){
  clearInterval(timer); running=false;
  idx++;
  if(idx < fullSeq.length) secondsLeft = fullSeq[idx].duration; else secondsLeft = 0;
  startBtn.disabled=false; pauseBtn.disabled=true;
  updateTop();
}

startBtn.addEventListener('click', startSession);
pauseBtn.addEventListener('click', pauseSession);
resetBtn.addEventListener('click', resetSession);
skipBtn.addEventListener('click', skipSegment);

updateTop();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(e=>console.log('SW reg failed', e));
}
