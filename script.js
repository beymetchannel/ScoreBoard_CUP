
const menuIcon = document.getElementById('menuIcon');
const menuPanel = document.getElementById('menuPanel');
const bladerBtn = document.getElementById('bladerBtn');
const bladerSubmenu = document.getElementById('bladerSubmenu');
const battleOptions = document.getElementById('battleOptions');
const dataBtn = menuPanel.querySelectorAll('.menu-btn')[2];
const dataSubmenu = document.getElementById('dataSubmenu');
const bladerList = document.getElementById('bladerList');
const resultBtn = menuPanel.querySelectorAll('.menu-btn')[1]; 
const resultSubmenu = document.getElementById('resultSubmenu');
const battleData = JSON.parse(localStorage.getItem('battleData') || '[]');
const API_URL = "https://script.google.com/macros/s/AKfycbykFaOdqDoREeSxO9wqF0bKaYVP15VcM4ycos3IejIwQ2Z3KWLS9m9nVrodesXPhF0ShA/exec";


async function saveBattleData() {
  const leftBlader = document.getElementById('leftBlader').value;
  const rightBlader = document.getElementById('rightBlader').value;
  const timestamp = formatTimestamp(new Date());

  const pointMap = { SF: 1, BF: 2, OF: 2, XF: 3 };
  const labelMap = { SF: 'SPIN', BF: 'BURST', OF: 'OVER', XF: 'XTREME' };

  // battleResults の中身を1件ずつスプレッドシートへ送信
  for (const [battleNoStr, result] of Object.entries(battleResults)) {
    const side = result.side;
    const type = result.type;
    const label = labelMap[type];
    const score = pointMap[type];

    let LResult = 0;
    let RResult = 0;

    if (side === 'L') {
      LResult = score;
      RResult = -score;
    } else if (side === 'R') {
      LResult = -score;
      RResult = score;
    }

    const battleData = {
      No: battleNoStr,         // A列
      LBlader: leftBlader,     // B列
      LBay: "未設定",           // C列
      LResult: LResult,        // D列
      LContent: label,         // E列
      RBlader: rightBlader,    // F列
      RBay: "未設定",           // G列
      RResult: RResult,        // H列
      RContent: label,         // I列
      Timestamp: timestamp,    // J列
    };

    try {
      const response = await fetch(`${API_URL}?action=saveBattle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(battleData),
      });

      const resultJson = await response.json();
      if (!resultJson.success) {
        console.error("送信エラー:", resultJson.error);
      } else {
        console.log(`Battle ${battleNoStr} 保存完了`);
      }
    } catch (err) {
      console.error("通信エラー:", err);
    }
  }
}



function formatTimestamp(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); 
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}



function saveBattleToSheet(battle) {
  //const url = "https://script.google.com/macros/s/AKfycbwq9xftzX_FN18HwaoXaKSbzcghyxvc1Zcpb2ZRDRd4tr1GMCpbeXXb4QKNn5eWsfv4HQ/exec";
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(battle)
  })
  .then(res => res.json())
  .then(res => console.log("保存完了:", res))
  .catch(err => console.error(err));
}



dataBtn.addEventListener('click', () => {
  if(openedSubmenu && openedSubmenu !== dataSubmenu){
    openedSubmenu.classList.remove('active'); 
  }
  
  const isActive = dataSubmenu.classList.contains('active');
  dataSubmenu.classList.toggle('active', !isActive);

  openedSubmenu = dataSubmenu.classList.contains('active') ? dataSubmenu : null;

  if(dataSubmenu.classList.contains('active')){
    showDataSubmenu();
  }
});

menuIcon.addEventListener('click', () => {
  const isActive = menuPanel.classList.contains('active');

  menuPanel.classList.toggle('active', !isActive);
  optionOverlay.classList.toggle('active', !isActive);

  bladerSubmenu.classList.remove('active');
  dataSubmenu.classList.remove('active');
  resultSubmenu.classList.remove('active');
  battleOptions.classList.add('hidden');

  openedSubmenu = null;
});



let openedSubmenu = null; 

bladerBtn.addEventListener('click', () => {
  if(openedSubmenu && openedSubmenu !== bladerSubmenu){
    openedSubmenu.classList.remove('active');
  }
  
  const isActive = bladerSubmenu.classList.contains('active');
  bladerSubmenu.classList.toggle('active', !isActive);

  openedSubmenu = bladerSubmenu.classList.contains('active') ? bladerSubmenu : null;
});



function updateBladerSelects() {
  const fullList = [...bladers];

  const leftSelect = document.getElementById('leftBlader');
  const rightSelect = document.getElementById('rightBlader');
  const selects = [leftSelect, rightSelect];

  selects.forEach(select => {
    const currentValue = select.value;
    select.innerHTML = '';
    fullList.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    if (fullList.includes(currentValue)) {
      select.value = currentValue;
    } else {
      select.value = ''; 
    }
    select._prevValue = select.value;
  });

  function handleSelectChange(side) {
  const leftSelect = document.getElementById('leftBlader');
  const rightSelect = document.getElementById('rightBlader');

  // 左右で同じブレーダーを選択したら右側を自動で切り替え
  if (leftSelect.value && leftSelect.value === rightSelect.value) {
    if (side === 'L') {
      rightSelect.selectedIndex = 0;
    } else {
      leftSelect.selectedIndex = 0;
    }
  }
}

  leftSelect.addEventListener('change', () => handleSelectChange('L'));
  rightSelect.addEventListener('change', () => handleSelectChange('R'));
}


document.querySelectorAll('.clear-select-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const side = btn.dataset.side;
    const select = document.getElementById(side === 'L' ? 'leftBlader' : 'rightBlader');
    select.value = '';
  });
});












let scores = { L: 0, R: 0 };
let battleResults = {};
let currentBattle = 1;
let lastBattleIndex = 0;
let openedButton = null; 

function toggleBattleOptions(num=null, side=null) {
  const resetBtn = document.querySelector('.reset-btn');

  if(openedSubmenu) {
    bladerSubmenu?.classList.remove('active');
    dataSubmenu?.classList.remove('active');
    resultSubmenu?.classList.remove('active');
    openedSubmenu = null;
    optionOverlay.classList.remove('active');
    return;
  }

  if((side==='L' || side==='R') && (scores.L>=4 || scores.R>=4)) return;

  if(num===null){
    num = Math.max(...Object.keys(battleResults).map(Number),0)+1;
  }

  const btnId = `battle${num}`;
  const btn = document.getElementById(btnId);
  const optionsEl = document.getElementById('battleOptions');
  const leftGroup = document.getElementById('leftOptions');
  const rightGroup = document.getElementById('rightOptions');


  if(openedButton === btn){
    document.getElementById('battleOptions').classList.add('hidden');
    optionOverlay.classList.remove('active');
    openedButton = null;

    resetBtn.disabled = false;
    resetBtn.style.opacity = 1;
    return;
  }

  currentBattle = num;
  openedButton = btn;
  optionsEl.classList.remove('hidden');
  optionOverlay.classList.add('active');

  if(side==='L'){
    leftGroup.style.display='grid';
    rightGroup.style.display='none';
  } else if(side==='R'){
    leftGroup.style.display='none';
    rightGroup.style.display='grid';
  } else {
    leftGroup.style.display='grid';
    rightGroup.style.display='grid';
  }

  resetBtn.disabled = true;
  resetBtn.style.opacity = 0.5;

  if (!optionOverlay.dataset.listenerAdded) {
    optionOverlay.addEventListener('click', () => {
      optionsEl.classList.add('hidden');
      optionOverlay.classList.remove('active');
      openedButton = null;
      resetBtn.disabled = false;
      resetBtn.style.opacity = 1;
    });
    optionOverlay.dataset.listenerAdded = "true"; 
  }
}

function selectResult(side, type) {
  const pointMap = { SF:1, BF:2, OF:2, XF:3 };
  const labelMap = { SF:'SPIN', BF:'BURST', OF:'OVER', XF:'XTREME' };
  const leftScoreEl = document.getElementById('leftScore');
  const rightScoreEl = document.getElementById('rightScore');
  const resetBtn = document.querySelector('.reset-btn');
  const btn = document.getElementById(`battle${currentBattle}`);
  const optionOverlay = document.getElementById('optionOverlay');

  btn.classList.remove("spin","burst","over","xtreme");

  if(battleResults[currentBattle]){
    const prev = battleResults[currentBattle];
    scores[prev.side]-=pointMap[prev.type];
  }

  battleResults[currentBattle]={side,type};
  scores[side]+=pointMap[type];
  lastBattleIndex=currentBattle;

  leftScoreEl.textContent=scores.L;
  rightScoreEl.textContent=scores.R;

  btn.textContent = labelMap[type];
  btn.classList.remove('tab-left','tab-right','no-glow');
  btn.classList.add(side==='L'?'tab-left':'tab-right','no-glow');

  if (type === "SF") btn.classList.add("spin");
  if (type === "BF") btn.classList.add("burst");
  if (type === "OF") btn.classList.add("over");
  if (type === "XF") btn.classList.add("xtreme");

  document.getElementById('battleOptions').classList.add('hidden');
  optionOverlay.classList.remove('active');
  openedButton = null;

  resetBtn.disabled = false;
  resetBtn.style.opacity = 1;

  checkForClearOrNext();
}


function checkForClearOrNext() {
  const hasClear=document.getElementById('clearBtn');
  const leftScoreEl=document.getElementById('leftScore');
  const rightScoreEl=document.getElementById('rightScore');

  if(scores.L>=4||scores.R>=4){
    if(scores.L>=4){leftScoreEl.style.color='yellow'; leftScoreEl.style.textShadow='0 0 25px yellow';}
    if(scores.R>=4){rightScoreEl.style.color='yellow'; rightScoreEl.style.textShadow='0 0 25px yellow';}

    if(!hasClear){
      const clearBtn=document.createElement('button');
      clearBtn.className='battle-btn clear-btn';
      clearBtn.id='clearBtn';
      clearBtn.textContent='CLEAR';
      clearBtn.onclick=clearAll;
      document.getElementById('battleBtnWrapper').appendChild(clearBtn);
      adjustButtonHeights();
    }
  }else{
    revealNextBattleButton(currentBattle);
  }
}

function revealNextBattleButton(currentIndex){
  const nextIndex=currentIndex+1;
  if(nextIndex>7) return;
  const wrapper=document.getElementById('battleBtnWrapper');
  if(!document.getElementById(`battle${nextIndex}`)){
    const nextBtn=document.createElement('button');
    nextBtn.className='battle-btn';
    nextBtn.id=`battle${nextIndex}`;
    nextBtn.textContent=getOrdinalSuffix(nextIndex);
    nextBtn.onclick=()=>toggleBattleOptions(nextIndex);
    wrapper.appendChild(nextBtn);
  }
  adjustButtonHeights();
}

function undoLastBattle(){
  if(!lastBattleIndex||!battleResults[lastBattleIndex]) return;
  const {side,type}=battleResults[lastBattleIndex];
  const pointMap={SF:1,BF:2,OF:2,XF:3};

  scores[side]-=pointMap[type];
  document.getElementById('leftScore').textContent=scores.L;
  document.getElementById('rightScore').textContent=scores.R;

  const btn=document.getElementById(`battle${lastBattleIndex}`);
  btn.textContent=getOrdinalSuffix(lastBattleIndex);
  btn.classList.remove('tab-left','tab-right','no-glow');

  btn.classList.remove('tab-left', 'tab-right', 'no-glow', "spin", "burst", "over", "xtreme");
  btn.removeAttribute("style");

  for(let i=lastBattleIndex+1;i<=7;i++){
    const b=document.getElementById(`battle${i}`);
    if(b)b.remove();
    delete battleResults[i];
  }

  delete battleResults[lastBattleIndex];
  lastBattleIndex=Math.max(...Object.keys(battleResults).map(Number),0)||0;

  document.getElementById('leftScore').style.color='#fff';
  document.getElementById('rightScore').style.color='#fff';
  document.getElementById('leftScore').style.textShadow='0 0 25px rgba(255,255,255,0.6)';
  document.getElementById('rightScore').style.textShadow='0 0 25px rgba(255,255,255,0.6)';
  const clearBtn=document.getElementById('clearBtn');
  if(clearBtn) clearBtn.remove();

  adjustButtonHeights();
}

function clearAll(){

  saveBattleData(); 

  scores={L:0,R:0};
  battleResults={};
  currentBattle=1;
  lastBattleIndex=0;
  openedButton = null;

  document.getElementById('leftScore').textContent=0;
  document.getElementById('rightScore').textContent=0;
  document.getElementById('leftScore').style.color='#fff';
  document.getElementById('rightScore').style.color='#fff';
  document.getElementById('leftScore').style.textShadow='0 0 25px rgba(255,255,255,0.6)';
  document.getElementById('rightScore').style.textShadow='0 0 25px rgba(255,255,255,0.6)';

  const wrapper=document.getElementById('battleBtnWrapper');
  wrapper.innerHTML=`<button class="battle-btn" id="battle1" onclick="toggleBattleOptions(1)">1st</button>`;

  adjustButtonHeights();
}

function adjustButtonHeights() {
  const wrapper = document.getElementById('battleBtnWrapper');
  const buttons = Array.from(wrapper.querySelectorAll('.battle-btn'));
  const resetBtn = document.querySelector('.reset-btn');
  
  const cardHeight = window.innerHeight * 0.9;
  const resetHeight = resetBtn ? resetBtn.offsetHeight : 0;

  if(buttons.length < 3) {
    wrapper.style.justifyContent = 'center';
  } else {
    wrapper.style.justifyContent = 'flex-start';
  }

  const gap = 5; 
  const availableHeight = cardHeight - resetHeight - ((buttons.length -1) * gap);
  const btnHeight = Math.min(60, availableHeight / buttons.length);

  buttons.forEach(btn => btn.style.height = btnHeight + 'px');
}


function getOrdinalSuffix(num) {
  if (num % 100 >= 11 && num % 100 <= 13) return num + 'th';
  switch (num % 10) {
    case 1: return num + 'st';
    case 2: return num + 'nd';
    case 3: return num + 'rd';
    default: return num + 'th';
  }
}


document.addEventListener('click', (event) => {
  const isClickInsideMenu = menuPanel.contains(event.target) 
                           || bladerSubmenu.contains(event.target)
                           || dataSubmenu.contains(event.target)
                           || resultSubmenu.contains(event.target)
                           || menuIcon.contains(event.target)
                           || bladerBtn.contains(event.target);

  if (!isClickInsideMenu) {
    menuPanel.classList.remove('active');
    bladerSubmenu.classList.remove('active');
    dataSubmenu.classList.remove('active');
    resultSubmenu.classList.remove('active');
    openedSubmenu = null; 
  }
});








function showDataSubmenu() {
  const dataList = JSON.parse(localStorage.getItem('battleData') || '[]');
  dataList.sort((a,b)=>new Date(b.timestamp) - new Date(a.timestamp));

  const container = document.getElementById('dataBattleList');
  container.innerHTML = '';

  const headerDiv = document.createElement('div');
  headerDiv.className = 'battleDataHeader';
  headerDiv.innerHTML = `
    <span>Blader</span>
    <span>Score</span>
    <span>Time</span>
    <span></span>
  `;
  container.appendChild(headerDiv);

  dataList.forEach((d, index) => {
    const date = new Date(d.timestamp);
    const hhmm = date.getHours().toString().padStart(2,'0') + ':' + date.getMinutes().toString().padStart(2,'0');

    const div = document.createElement('div');
    div.className = 'battleDataItem';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '2fr 1fr 1fr auto';
    div.style.alignItems = 'center';

    div.innerHTML = `
      <span>${d.blader}</span>
      <span>${d.score}-${d.opponentScore}</span>
      <span>${hhmm}</span>
      <button class="small-del-btn">Del</button>
    `;

    div.querySelector('.small-del-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if(confirm("このデータを削除してもよろしいですか？")) {
        dataList.splice(index, 1);
        showDataSubmenu(); 
      }
    });

    container.appendChild(div);
  });
}


function showResultSubmenu() {
  const dataList = JSON.parse(localStorage.getItem('battleData') || '[]');
  dataList.sort((a,b)=>new Date(b.timestamp) - new Date(a.timestamp)); 

  const container = document.getElementById('resultBattleList');
  container.innerHTML = '';

  const summary = {};

  dataList.forEach(d => {
    if(!summary[d.blader]){
      summary[d.blader] = {battle:0, win:0, lose:0, score:0, loss:0};
    }
    summary[d.blader].battle++;
    summary[d.blader].score += d.score;
    summary[d.blader].loss += d.opponentScore;
    if(d.score > d.opponentScore) summary[d.blader].win++;
    else summary[d.blader].lose++;
  });


 const headerDiv = document.createElement('div');
headerDiv.className = 'battleDataHeader';
headerDiv.style.display = 'grid';
headerDiv.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 1fr 2fr 1fr';
headerDiv.innerHTML = `
  <span>Blader</span>
  <span>Battle</span>
  <span>Win</span>
  <span>Lose</span>
  <span>Win%</span>
  <span>Score</span>
  <span>Diff</span>
`;
container.appendChild(headerDiv);

  Object.entries(summary).forEach(([blader, stats]) => {
    const winRate = stats.battle ? Math.floor((stats.win / stats.battle) * 100) + '%' : '0%';
    const diff = stats.score - stats.loss;
    const div = document.createElement('div');
    div.className = 'battleDataItem';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '2fr 1fr 1fr 1fr 1fr 2fr 1fr'; 
    div.innerHTML = `
      <span>${blader}</span>
      <span>${stats.battle}</span>
      <span>${stats.win}</span>
      <span>${stats.lose}</span>
      <span>${winRate}</span>
      <span>${stats.score}-${stats.loss}</span>
      <span>${diff}</span>
    `;
    container.appendChild(div);
  });
}

let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', `${vh}px`);




resultBtn.addEventListener('click', () => {
  if(openedSubmenu && openedSubmenu !== resultSubmenu){
    openedSubmenu.classList.remove('active'); 
  }
  const isActive = resultSubmenu.classList.contains('active');
  resultSubmenu.classList.toggle('active', !isActive);
  openedSubmenu = resultSubmenu.classList.contains('active') ? resultSubmenu : null;

  if(resultSubmenu.classList.contains('active')){
    showResultSubmenu();
  }
});



document.addEventListener("DOMContentLoaded", function() {
    const resultClearBtn = document.getElementById("resultClearBtn");
    const resultBattleList = document.getElementById("resultBattleList");
    const leftScore = document.getElementById("leftScore");
    const rightScore = document.getElementById("rightScore");




    resultClearBtn.addEventListener("click", function() {

        if (confirm("全バトルデータを削除してもよろしいですか？")) {

            localStorage.removeItem("battleData"); 
            localStorage.removeItem("resultData");

            showResultSubmenu();
            showDataSubmenu();
        }
    });
});



function updateResultList() {
  const resultList = document.getElementById('resultBattleList');
  resultList.innerHTML = '';

  if(battleData.length === 0){
    resultList.innerHTML = '<div style="color:#fff; text-align:center;">データがありません</div>';
    return;
  }

  battleData.forEach(item => {
    const div = document.createElement('div');
    div.className = 'battleDataItem';
    div.innerHTML = `
      <span>${item.blader}</span>
      <span>${item.score}</span>
      <span>${item.time}</span>
    `;
    resultList.appendChild(div);
  });
}


optionOverlay.addEventListener('click', () => {
  const optionsEl = document.getElementById('battleOptions');
  optionsEl.classList.add('hidden');
  optionOverlay.classList.remove('active');
  openedButton = null;
});

function closeAllSubmenus() {
  bladerSubmenu?.classList.remove('active');
  dataSubmenu?.classList.remove('active');
  resultSubmenu?.classList.remove('active');
  menuPanel?.classList.remove('active');
  optionOverlay?.classList.remove('active');
  openedSubmenu = null;
}


window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('overlay');

  
  if (!sessionStorage.getItem('welcomeShown')) {
    overlay.style.display = 'flex';

    overlay.addEventListener('click', () => {
      overlay.style.transition = 'opacity 0.5s ease';
      overlay.style.opacity = '0';

      setTimeout(() => {
        overlay.style.display = 'none';
        sessionStorage.setItem('welcomeShown', 'true'); 
        location.reload(); 
      }, 500);
    });
  } else {
    overlay.style.display = 'none';
  }
  loadBladers();
});


window.addEventListener('load', adjustButtonHeights);
window.addEventListener('resize', adjustButtonHeights);