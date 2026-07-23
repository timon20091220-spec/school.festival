const booths = [
  {
    id: 'ghost', name: '미스터리 하우스', emoji: '👻', room: '본관 2층 2-5반', duration: 15,
    description: '빛과 소리로 꾸민 몰입형 공포 미션 체험',
    details: '4명이 한 팀이 되어 제한 시간 안에 단서를 찾는 체험입니다.',
    gradient: 'linear-gradient(135deg,#29213f,#7d4bc4)', capacity: 6,
    slots: ['10:00','10:20','10:40','11:00','11:20','13:00','13:20','13:40']
  },
  {
    id: 'casino', name: '행운의 카지노', emoji: '🎲', room: '본관 3층 2-3반', duration: 20,
    description: '가상 칩으로 즐기는 확률 게임과 미니 룰렛',
    details: '실제 금전 사용 없이 확률과 전략을 체험하는 건전한 게임 부스입니다.',
    gradient: 'linear-gradient(135deg,#116149,#20a875)', capacity: 8,
    slots: ['10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30']
  },
  {
    id: 'photo', name: '네컷 사진관', emoji: '📸', room: '별관 1층 미술실', duration: 10,
    description: '축제 전용 프레임과 소품으로 남기는 네컷 사진',
    details: '예약 시간 5분 전 도착해 원하는 소품을 골라주세요.',
    gradient: 'linear-gradient(135deg,#ff8067,#ffb15f)', capacity: 4,
    slots: ['10:00','10:15','10:30','10:45','11:00','11:15','13:00','13:15','13:30','13:45']
  },
  {
    id: 'lab', name: '과학 탈출 연구소', emoji: '🧪', room: '과학관 2층 화학실', duration: 20,
    description: '간단한 과학 원리를 이용해 암호를 푸는 방탈출',
    details: '안전요원의 안내에 따라 실험 도구를 사용합니다.',
    gradient: 'linear-gradient(135deg,#2363d1,#55a5ff)', capacity: 6,
    slots: ['10:10','10:40','11:10','11:40','13:10','13:40','14:10','14:40']
  }
];

const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const installButton = document.querySelector('#installButton');
let deferredPrompt = null;
let selectedBooth = null;
let selectedSlot = null;

function getReservations(){ return JSON.parse(localStorage.getItem('festivalReservations') || '[]'); }
function saveReservations(items){ localStorage.setItem('festivalReservations', JSON.stringify(items)); }
function makeCode(){ return Math.random().toString(36).slice(2,8).toUpperCase(); }
function showToast(message){ toast.textContent=message; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); }
function bookedCount(boothId, slot){ return getReservations().filter(r=>r.boothId===boothId && r.slot===slot).length; }
function setActiveNav(route){ document.querySelectorAll('.nav-item').forEach(btn=>btn.classList.toggle('active',btn.dataset.route===route)); }
function updateRoute(route){ history.replaceState(null,'',`#${route}`); setActiveNav(route); render(route); window.scrollTo({top:0,behavior:'smooth'}); }
function formatStudentId(v){ return v.replace(/\D/g,'').slice(0,5); }

function render(route='home'){
  if(route==='home') return renderHome();
  if(route==='reservations') return renderReservations();
  if(route==='guide') return renderGuide();
  if(route==='admin') return renderAdminLogin();
  if(route.startsWith('booth/')) return renderBooth(route.split('/')[1]);
  renderHome();
}

function renderHome(){
  const total = booths.reduce((sum,b)=>sum+b.slots.length*b.capacity,0);
  const used = getReservations().length;
  app.innerHTML = `
    <section class="hero">
      <h2>기다리지 말고<br>원하는 부스를 예약하세요</h2>
      <p>QR로 접속하고 시간대를 고르면 예약 완료!</p>
      <div class="hero-stats">
        <div class="stat"><strong>${booths.length}</strong><span>예약 부스</span></div>
        <div class="stat"><strong>${Math.max(total-used,0)}</strong><span>남은 전체 자리</span></div>
        <div class="stat"><strong>${getReservations().length}</strong><span>내 기기 예약</span></div>
      </div>
    </section>
    <div class="section-head"><div><h2>체험 부스</h2><p>원하는 부스를 선택하세요</p></div></div>
    <section class="booth-grid">
      ${booths.map(b=>{
        const remaining = b.slots.reduce((sum,s)=>sum+Math.max(b.capacity-bookedCount(b.id,s),0),0);
        return `<article class="booth-card" data-booth="${b.id}" tabindex="0">
          <div class="booth-art" style="background:${b.gradient}"><span class="emoji">${b.emoji}</span></div>
          <div class="booth-body">
            <div class="booth-topline"><div><h3>${b.name}</h3><p>${b.description}</p></div><span class="badge ${remaining<8?'hot':'open'}">${remaining}자리</span></div>
            <div class="meta-row"><span class="meta">📍 ${b.room}</span><span class="meta">⏱ ${b.duration}분</span></div>
          </div>
        </article>`;
      }).join('')}
    </section>`;
  document.querySelectorAll('[data-booth]').forEach(card=>{
    const open=()=>updateRoute(`booth/${card.dataset.booth}`);
    card.addEventListener('click',open); card.addEventListener('keydown',e=>{if(e.key==='Enter')open();});
  });
}

function renderBooth(id){
  const booth=booths.find(b=>b.id===id); if(!booth) return updateRoute('home');
  selectedBooth=booth; selectedSlot=null;
  app.innerHTML=`
    <button class="back-button" id="backHome">← 부스 목록</button>
    <section class="detail-banner" style="background:${booth.gradient}">
      <span class="emoji">${booth.emoji}</span><h2>${booth.name}</h2><p>${booth.description}</p>
    </section>
    <section class="panel"><h3>부스 정보</h3><div class="info-list">
      <div class="info-row"><strong>장소</strong><span>${booth.room}</span></div>
      <div class="info-row"><strong>소요 시간</strong><span>약 ${booth.duration}분</span></div>
      <div class="info-row"><strong>안내</strong><span>${booth.details}</span></div>
    </div></section>
    <section class="panel"><h3>예약 시간 선택</h3><div class="slot-grid">
      ${booth.slots.map(slot=>{ const left=booth.capacity-bookedCount(booth.id,slot); return `<button class="slot ${left<=0?'full':''}" data-slot="${slot}" ${left<=0?'disabled':''}><strong>${slot}</strong><span>${left<=0?'예약 마감':`남은 자리 ${left}/${booth.capacity}`}</span></button>`; }).join('')}
    </div></section>
    <section class="panel"><h3>예약자 정보</h3><form id="reservationForm" class="form-grid">
      <div class="field"><label for="studentId">학번</label><input id="studentId" name="studentId" inputmode="numeric" placeholder="예: 20505" required /></div>
      <div class="field"><label for="studentName">이름</label><input id="studentName" name="studentName" autocomplete="name" placeholder="이름을 입력하세요" maxlength="12" required /></div>
      <label class="check-row"><input type="checkbox" id="privacyAgree" required /><span>예약 운영을 위한 이름·학번 저장에 동의합니다. <a href="privacy.html">안내 보기</a></span></label>
      <button class="primary-button" type="submit">선택한 시간으로 예약하기</button>
    </form></section>`;
  document.querySelector('#backHome').onclick=()=>updateRoute('home');
  document.querySelectorAll('.slot:not(.full)').forEach(btn=>btn.onclick=()=>{
    selectedSlot=btn.dataset.slot; document.querySelectorAll('.slot').forEach(s=>s.classList.remove('selected')); btn.classList.add('selected');
  });
  const sid=document.querySelector('#studentId'); sid.addEventListener('input',()=>sid.value=formatStudentId(sid.value));
  document.querySelector('#reservationForm').addEventListener('submit',handleReservation);
}

function handleReservation(e){
  e.preventDefault();
  if(!selectedSlot) return showToast('먼저 예약 시간을 선택해주세요.');
  const studentId=document.querySelector('#studentId').value.trim();
  const studentName=document.querySelector('#studentName').value.trim();
  if(studentId.length<4) return showToast('학번을 정확히 입력해주세요.');
  const items=getReservations();
  if(items.some(r=>r.studentId===studentId && r.boothId===selectedBooth.id)) return showToast('이 부스는 이미 예약했습니다.');
  if(items.some(r=>r.studentId===studentId && r.slot===selectedSlot)) return showToast('같은 시간에 다른 예약이 있습니다.');
  if(bookedCount(selectedBooth.id,selectedSlot)>=selectedBooth.capacity) return showToast('방금 예약이 마감되었습니다.');
  const reservation={id:crypto.randomUUID?crypto.randomUUID():Date.now().toString(), code:makeCode(), boothId:selectedBooth.id, slot:selectedSlot, studentId, studentName, createdAt:new Date().toISOString()};
  items.push(reservation); saveReservations(items); showToast('예약이 완료되었습니다!'); updateRoute('reservations');
}

function renderReservations(){
  const items=getReservations().slice().reverse();
  app.innerHTML=`<div class="section-head"><div><h2>내 예약</h2><p>예약 화면을 부스 담당자에게 보여주세요</p></div></div>
    ${items.length?items.map(r=>{const b=booths.find(x=>x.id===r.boothId); return `<article class="reservation-card">
      <div class="status-line"><span class="badge open">예약 완료</span><span class="small">${r.studentId} ${r.studentName}</span></div>
      <h3>${b?.emoji||'🎪'} ${b?.name||'부스'}</h3><p>🕒 ${r.slot} · 약 ${b?.duration||'-'}분</p><p>📍 ${b?.room||'-'}</p>
      <div class="reservation-code">${r.code}</div>
      <button class="danger-button" data-cancel="${r.id}">예약 취소</button>
    </article>`;}).join(''):`<div class="empty"><span class="emoji">🎟️</span><strong>아직 예약이 없습니다.</strong><p>부스 메뉴에서 원하는 체험을 예약해보세요.</p></div>`}`;
  document.querySelectorAll('[data-cancel]').forEach(btn=>btn.onclick=()=>{
    if(confirm('이 예약을 취소할까요?')){saveReservations(getReservations().filter(r=>r.id!==btn.dataset.cancel));showToast('예약을 취소했습니다.');renderReservations();}
  });
}

function renderGuide(){
  app.innerHTML=`
    <div class="section-head"><div><h2>이용 안내</h2><p>설치와 알림 설정 방법</p></div></div>
    <section class="guide-list">
      <div class="guide-item"><span class="guide-number">1</span><div><h3>QR코드로 접속</h3><p>축제 포스터의 QR코드를 카메라로 촬영해 앱을 엽니다.</p></div></div>
      <div class="guide-item"><span class="guide-number">2</span><div><h3>홈 화면에 설치</h3><p>안드로이드는 설치 버튼, 아이폰 Safari는 공유 → 홈 화면에 추가를 선택합니다.</p></div></div>
      <div class="guide-item"><span class="guide-number">3</span><div><h3>부스와 시간 선택</h3><p>남은 자리 수를 확인하고 학번과 이름으로 예약합니다.</p></div></div>
      <div class="guide-item"><span class="guide-number">4</span><div><h3>예약 화면 제시</h3><p>체험 시간 5분 전에 도착해 예약 코드를 보여주세요.</p></div></div>
    </section>
    <section class="panel"><h3>알림 설정</h3><p class="small">이 시제품에서는 권한 확인과 테스트 알림만 제공합니다. 실제 예약 10분 전 자동 알림은 Firebase 같은 서버를 연결한 정식 버전에서 작동합니다.</p><button id="notificationButton" class="secondary-button">알림 허용 및 테스트</button></section>
    <div class="notice">현재 시제품의 예약 정보는 이 휴대폰에만 저장됩니다. 여러 학생의 예약을 동시에 공유하려면 온라인 데이터베이스 연결이 필요합니다.</div>`;
  document.querySelector('#notificationButton').onclick=requestNotification;
}

async function requestNotification(){
  if(!('Notification' in window)) return showToast('이 브라우저는 알림을 지원하지 않습니다.');
  const permission=await Notification.requestPermission();
  if(permission!=='granted') return showToast('알림 권한이 허용되지 않았습니다.');
  const reg=await navigator.serviceWorker.ready;
  reg.showNotification('배문제 예약 알림 테스트',{body:'알림 설정이 완료되었습니다.',icon:'icons/icon-192.png',badge:'icons/icon-192.png'});
  showToast('테스트 알림을 보냈습니다.');
}

function renderAdminLogin(){
  app.innerHTML=`<div class="section-head"><div><h2>운영자 메뉴</h2><p>시제품 비밀번호: 2026</p></div></div><section class="panel"><form id="adminLogin" class="form-grid"><div class="field"><label for="adminPin">운영자 비밀번호</label><input id="adminPin" type="password" inputmode="numeric" placeholder="비밀번호 입력" required /></div><button class="primary-button">운영자 화면 열기</button></form></section>`;
  document.querySelector('#adminLogin').onsubmit=e=>{e.preventDefault();document.querySelector('#adminPin').value==='2026'?renderAdmin():showToast('비밀번호가 다릅니다.');};
}

function renderAdmin(){
  const items=getReservations().slice().sort((a,b)=>a.slot.localeCompare(b.slot));
  app.innerHTML=`<div class="section-head"><div><h2>예약 현황</h2><p>총 ${items.length}건</p></div></div>
    <section class="panel"><div style="overflow:auto"><table class="admin-table"><thead><tr><th>시간</th><th>부스</th><th>학번</th><th>이름</th><th>코드</th></tr></thead><tbody>${items.length?items.map(r=>{const b=booths.find(x=>x.id===r.boothId);return `<tr><td>${r.slot}</td><td>${b?.name||'-'}</td><td>${r.studentId}</td><td>${r.studentName}</td><td>${r.code}</td></tr>`;}).join(''):'<tr><td colspan="5">예약 데이터가 없습니다.</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h3>시제품 관리</h3><div class="button-row"><button id="exportData" class="secondary-button">CSV 내려받기</button><button id="resetData" class="danger-button">전체 초기화</button></div></section>`;
  document.querySelector('#resetData').onclick=()=>{if(confirm('이 기기의 모든 예약을 삭제할까요?')){saveReservations([]);showToast('초기화했습니다.');renderAdmin();}};
  document.querySelector('#exportData').onclick=exportCSV;
}

function exportCSV(){
  const rows=[['시간','부스','학번','이름','예약코드'],...getReservations().map(r=>{const b=booths.find(x=>x.id===r.boothId);return [r.slot,b?.name||'',r.studentId,r.studentName,r.code];})];
  const csv='\uFEFF'+rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download='축제_예약명단.csv';a.click();URL.revokeObjectURL(url);
}

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>updateRoute(btn.dataset.route)));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installButton.classList.remove('hidden');});
installButton.addEventListener('click',async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installButton.classList.add('hidden');});
window.addEventListener('appinstalled',()=>showToast('홈 화면에 설치되었습니다.'));
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));
const initial=(location.hash||'#home').slice(1);setActiveNav(initial.startsWith('booth/')?'home':initial);render(initial);
