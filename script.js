/* Quadricipite Timer - minimal PWA logic
Sequence created from user's final plan:
- Warmup: Cyclette 3 min (work)
- Sollevamento gamba sx con cuscino: 30s work + 15s rest ×12
- Sollevamento gamba sx - serie breve: 20s work + 10s rest ×12
- Wall squat singola: 30s work + 20s rest ×10
- Cyclette defaticamento: 5min work +1min rest ×2
Displays: MM:SS, green during work, red during rest, background tint on rest.
Completed items are removed from the list.
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
const endScreen = document.getElementById('end-screen');
const restartBtn = document.getElementById('restartBtn');

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
  sequence.forEach((item,i)=>{
    if(i < idx) return; // already completed -> hide
    const el = document.createElement('div');
    el.className = 'item' + (i===idx ? ' current' : '');
    el.innerHTML = '<div>' + (i+1) + '. ' + item.title + (item.rep ? ' (rep ' + item.rep + '/' + item.reps + ')' : '') + '</div>'
      + '<div style="opacity:0.75;font-size:0.95rem">' + (item.type==='work' ? 'Lavoro' : 'Recupero') + '</div>';
    seqDiv.appendChild(el);
  });
}

function updateTop(){
  if(idx >= sequence.length){
    timerLarge.textContent = '00:00';
    phaseSmall.textContent = 'Completato';
    label.textContent = '';
    document.body.style.background = '';
    return;
  }
  const cur = sequence[idx];
  timerLarge.textContent = formatTime(secondsLeft);
  phaseSmall.textContent = cur.type==='work' ? 'LAVORO' : 'RECUPERO';
  label.textContent = cur.title + (cur.rep ? ' — rep ' + cur.rep + '/' + cur.reps : '');
  // colors
  if(cur.type==='work'){
    timerLarge.style.color = getComputedStyle(document.documentElement).getPropertyValue('--work');
    document.body.style.background = 'var(--bg)';
  } else {
    timerLarge.style.color = getComputedStyle(document.documentElement).getPropertyValue('--rest');
    document.body.style.background = 'linear-gradient(180deg, rgba(255,0,0,0.03), var(--bg))';
  }
  progress.textContent = (idx+1) + ' / ' + sequence.length;
}

function playBeep(n=1){
  // n not used to change sound but play quick sequences if needed
  try{
    beep.volume = 1.0;
    beep.currentTime = 0;
    beep.play();
    if(n===2){
      setTimeout(()=>{ beep.currentTime=0; beep.play(); }, 180);
    }
  }catch(e){ console.log('audio blocked', e); }
}

function tick(){
  if(secondsLeft>0){
    secondsLeft--;
    updateTop();
  } else {
    // end of a segment
    // for end of work -> two beeps quick; for rest -> single beep
    const cur = sequence[idx];
    if(cur.type==='work'){
      playBeep(2);
    } else {
      playBeep(1);
    }
    idx++;
    if(idx < sequence.length){
      secondsLeft = sequence[idx].duration;
      // at start of new segment play a beep for start
      setTimeout(()=>playBeep(1), 180);
    } else {
      secondsLeft = 0;
      // finished all
      running = false;
      clearInterval(timer);
      endSession();
    }
    renderList();
    updateTop();
  }
}

function startSession(){
  if(idx >= sequence.length){ idx = 0; secondsLeft = sequence[0].duration; }
  if(!running){
    timer = setInterval(tick, 1000);
    running = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    playBeep(1); // start beep
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
  startBtn.disabled = false; pauseBtn.disabled = true;
  renderList(); updateTop();
}

function endSession(){
  // show end screen
  document.getElementById('main').style.display = 'none';
  endScreen.hidden = false;
}

startBtn.addEventListener('click', startSession);
pauseBtn.addEventListener('click', pauseSession);
resetBtn.addEventListener('click', resetSession);
skipBtn.addEventListener('click', skipSegment);
if(restartBtn) restartBtn.addEventListener('click', ()=>{
  endScreen.hidden = true;
  document.getElementById('main').style.display = '';
  resetSession();
  startSession();
});

renderList();
updateTop();

// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./service-worker.js').catch(e=>console.log('SW reg failed', e));
}
