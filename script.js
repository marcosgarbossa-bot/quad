/* Quadricipite Timer final - no end message, list items removed when completed */
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

function pushBlock(arr, title, workSec, restSec, reps){
  for(let i=0;i<reps;i++){
    arr.push({title, duration: workSec, type: 'work', rep: i+1, reps});
    if(restSec>0) arr.push({title, duration: restSec, type: 'rest', rep: i+1, reps});
  }
}

let sequence = [];
sequence.push({title: 'Cyclette (riscaldamento)', duration: 3*60, type: 'work'});
pushBlock(sequence, 'Sollevamento gamba sx con cuscino', 30, 15, 12);
pushBlock(sequence, 'Sollevamento gamba sx - serie breve', 20, 10, 12);
pushBlock(sequence, 'Wall squat gamba singola (sx)', 30, 20, 10);
pushBlock(sequence, 'Cyclette (defaticamento)', 5*60, 60, 2);

let idx = 0;
let secondsLeft = sequence.length ? sequence[0].duration : 0;
let timer = null;
let running = false;

function formatTime(s){
  const m = Math.floor(s/60);
  const sec = s%60;
  return String(m).padStart(2,'0') + ':' + String(sec).padStart(2,'0');
}

function renderList(){
  seqDiv.innerHTML = '';
  for(let i=idx;i<sequence.length;i++){
    const item = sequence[i];
    const el = document.createElement('div');
    el.className = 'item' + (i===idx ? ' current' : '');
    el.innerHTML = '<div>' + (i+1) + '. ' + item.title + (item.rep ? ' (rep ' + item.rep + '/' + item.reps + ')' : '') + '</div>'
      + '<div style="opacity:0.75;font-size:0.95rem">' + (item.type==='work' ? 'Lavoro' : 'Recupero') + '</div>';
    seqDiv.appendChild(el);
  }
}

function updateTop(){
  if(idx >= sequence.length){
    timerLarge.textContent = '00:00';
    phaseSmall.textContent = '';
    label.textContent = '';
    document.body.style.background = '';
    return;
  }
  const cur = sequence[idx];
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
  progress.textContent = (idx+1) + ' / ' + sequence.length;
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
    const cur = sequence[idx];
    if(cur.type==='work'){
      playBeep(2);
    } else {
      playBeep(1);
    }
    idx++;
    if(idx < sequence.length){
      secondsLeft = sequence[idx].duration;
      setTimeout(()=>playBeep(1), 120);
    } else {
      secondsLeft = 0;
      clearInterval(timer);
      running = false;
    }
    renderList();
    updateTop();
  }
}

function startSession(){
  if(idx >= sequence.length){ idx = 0; secondsLeft = sequence.length ? sequence[0].duration : 0; }
  if(!running){
    timer = setInterval(tick, 1000);
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    playBeep(1);
  }
}

function pauseSession(){
  if(running){ clearInterval(timer); running=false; startBtn.disabled=false; pauseBtn.disabled=true; }
}

function resetSession(){
  clearInterval(timer); running=false; idx=0; secondsLeft = sequence.length ? sequence[0].duration : 0;
  startBtn.disabled=false; pauseBtn.disabled=true;
  renderList(); updateTop();
}

function skipSegment(){
  clearInterval(timer); running=false;
  idx++;
  if(idx < sequence.length) secondsLeft = sequence[idx].duration; else secondsLeft = 0;
  startBtn.disabled=false; pauseBtn.disabled=true;
  renderList(); updateTop();
}

startBtn.addEventListener('click', startSession);
pauseBtn.addEventListener('click', pauseSession);
resetBtn.addEventListener('click', resetSession);
skipBtn.addEventListener('click', skipSegment);

renderList();
updateTop();

if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(e=>console.log('SW reg failed', e));
}
