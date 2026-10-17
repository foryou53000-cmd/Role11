/**
 * 학급 1인 1역할 배정기 - script.js
 * 초등학생 눈높이에 맞춘 랜덤 역할 배정, A4 인쇄 및 구글 스프레드시트 연동
 */

export const DEFAULT_STUDENTS = [
  '김민준', '이서아', '박도윤', '정하윤',
  '최시우', '강지안', '윤도현', '조예린',
  '임준우', '한수아', '오지호', '배유진'
];

export const DEFAULT_ROLES = [
  { id: '1', name: '칠판 지우미', icon: '🧹', desc: '칠판을 반짝반짝 깨끗하게 닦아요', color: 'mint' },
  { id: '2', name: '우유 도우미', icon: '🥛', desc: '시원하고 맛있는 우유를 챙겨줘요', color: 'blue' },
  { id: '3', name: '에너지 지킴이', icon: '💡', desc: '나갈 때 전등과 냉난방기를 꺼요', color: 'yellow' },
  { id: '4', name: '줄서기 반장', icon: '🚶', desc: '이동할 때 바른 걸음으로 줄을 이끌어요', color: 'peach' },
  { id: '5', name: '도서 정리왕', icon: '📚', desc: '학급 문고 책을 바르게 꽂아요', color: 'lavender' },
  { id: '6', name: '분리수거 요원', icon: '♻️', desc: '재활용 쓰레기를 바르게 분류해요', color: 'mint' },
  { id: '7', name: '창문 환기 요정', icon: '🪟', desc: '쉬는 시간마다 상쾌한 공기를 선물해요', color: 'sky' },
  { id: '8', name: '학습지 도우미', icon: '📑', desc: '선생님 학습지와 알림장을 나눠줘요', color: 'pink' },
  { id: '9', name: '화분 사랑단', icon: '🌱', desc: '교실 화분에 물을 주고 사랑을 줘요', color: 'yellow' },
  { id: '10', name: '보건 위생 지킴이', icon: '🧼', desc: '깨끗한 손 씻기와 위생을 안내해요', color: 'blue' },
  { id: '11', name: '컴퓨터·TV 관리관', icon: '💻', desc: '수업 후 전자칠판과 컴퓨터를 확인해요', color: 'lavender' },
  { id: '12', name: '칭찬 배달원', icon: '💌', desc: '친구들에게 고운 말과 칭찬을 전해요', color: 'peach' }
];

// Fisher-Yates 무작위 셔플 알고리즘
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 학생과 역할 1:1 무작위 배정 로직
export function assignRoles(students, roles) {
  if (!students || students.length === 0) return [];
  if (!roles || roles.length === 0) return [];

  const shuffledStudents = shuffleArray(students);
  const shuffledRoles = shuffleArray(roles);

  const count = Math.max(shuffledStudents.length, shuffledRoles.length);
  const assignments = [];

  for (let i = 0; i < count; i++) {
    const student = shuffledStudents[i % shuffledStudents.length];
    const role = shuffledRoles[i % shuffledRoles.length];
    assignments.push({
      id: i + 1,
      student,
      role
    });
  }

  return assignments;
}

// 구글 스프레드시트(Apps Script) 전송용 데이터 포맷
export function formatForSpreadsheet(assignments, className = '우리 반') {
  const dateStr = new Date().toLocaleDateString('ko-KR');
  const rows = assignments.map((item, idx) => ({
    no: idx + 1,
    student: item.student,
    roleName: item.role.name,
    roleIcon: item.role.icon || '⭐',
    roleDesc: item.role.desc || '',
    assignedDate: dateStr
  }));

  return {
    className,
    assignedDate: dateStr,
    totalCount: assignments.length,
    rows
  };
}

// 구글 시트에서 가져온 데이터 파싱
export function parseSpreadsheetData(data) {
  let students = [];
  let roles = [];

  if (Array.isArray(data)) {
    // Array of objects format
    data.forEach(item => {
      if (item.student) students.push(item.student);
      if (item.roleName || item.name) {
        roles.push({
          id: String(roles.length + 1),
          name: item.roleName || item.name,
          icon: item.roleIcon || item.icon || '⭐',
          desc: item.roleDesc || item.desc || '맡은 역할을 성실히 수행해요',
          color: 'mint'
        });
      }
    });
  } else if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data.students)) students = data.students;
    if (Array.isArray(data.roles)) {
      roles = data.roles.map((r, i) => ({
        id: String(i + 1),
        name: typeof r === 'string' ? r : (r.name || `역할 ${i + 1}`),
        icon: r.icon || '⭐',
        desc: r.desc || '맡은 역할을 성실히 수행해요',
        color: r.color || 'mint'
      }));
    }
  }

  return {
    students: students.length ? students : DEFAULT_STUDENTS,
    roles: roles.length ? roles : DEFAULT_ROLES
  };
}

/* ==========================================================================
   브라우저 인터랙션 및 UI 제어 (DOM 초기화 및 이벤트 연결)
   ========================================================================== */

if (typeof window !== 'undefined') {
  // 로컬 스토리지 키
  const STORAGE_KEYS = {
    STUDENTS: 'class_role_students',
    ROLES: 'class_role_roles',
    ASSIGNMENTS: 'class_role_assignments',
    CLASS_NAME: 'class_role_classname',
    SHEETS_URL: 'class_role_sheets_url'
  };

  // 애플리케이션 상태
  const state = {
    className: localStorage.getItem(STORAGE_KEYS.CLASS_NAME) || '햇살초등학교 3학년 2반',
    students: loadStorage(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS),
    roles: loadStorage(STORAGE_KEYS.ROLES, DEFAULT_ROLES),
    assignments: loadStorage(STORAGE_KEYS.ASSIGNMENTS, []),
    sheetsUrl: localStorage.getItem(STORAGE_KEYS.SHEETS_URL) || '',
    isShuffling: false,
    soundEnabled: true
  };

  function loadStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveStorage(key, val) {
    try {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  // 간단한 효과음 (Web Audio API)
  function playSound(type) {
    if (!state.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'dice') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'sine';
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
          noteGain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
          noteOsc.start(ctx.currentTime + idx * 0.08);
          noteOsc.stop(ctx.currentTime + idx * 0.08 + 0.25);
        });
      }
    } catch {
      // AudioContext unavailable
    }
  }

  // 콘페티 꽃가루 효과 (순수 Canvas 구현)
  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#FF8A80', '#FFD180', '#FFFF8D', '#CCFF90', '#A7FFEB', '#80D8FF', '#EA80FC'];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height * 0.45,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12,
      life: 1
    }));

    let animationFrame;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.rotation += p.vRot;
        p.life -= 0.012;

        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (alive) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animationFrame);
      }
    }
    render();
  }

  // 카드 렌더링
  function renderCards(assignments) {
    const grid = document.getElementById('cardsGrid');
    const emptyState = document.getElementById('emptyState');
    const statusBadge = document.getElementById('statusBadge');
    const studentCountEl = document.getElementById('studentCount');
    const roleCountEl = document.getElementById('roleCount');

    if (studentCountEl) studentCountEl.textContent = state.students.length;
    if (roleCountEl) roleCountEl.textContent = state.roles.length;

    if (!grid) return;

    if (!assignments || assignments.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      if (statusBadge) {
        statusBadge.textContent = '⏳ 배정 대기중';
        statusBadge.className = 'status-badge waiting';
      }
      renderPrintView([]);
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (statusBadge) {
      statusBadge.textContent = `🎉 ${assignments.length}명 배정 완료!`;
      statusBadge.className = 'status-badge done';
    }

    grid.innerHTML = '';
    assignments.forEach((item, index) => {
      const card = document.createElement('div');
      const color = item.role.color || 'mint';
      card.className = `role-card pastel-${color}`;
      card.setAttribute('data-id', item.id);
      card.style.animationDelay = `${index * 0.04}s`;

      card.innerHTML = `
        <div class="card-header">
          <span class="role-badge">역할 #${String(index + 1).padStart(2, '0')}</span>
          <span class="card-icon" aria-hidden="true">${item.role.icon || '⭐'}</span>
        </div>
        <div class="card-role-title">${escapeHtml(item.role.name)}</div>
        <div class="card-desc">${escapeHtml(item.role.desc || '')}</div>
        <div class="card-divider"></div>
        <div class="assigned-student-box">
          <span class="student-label">담당 학생</span>
          <div class="student-name-wrapper">
            <span class="student-avatar">🎒</span>
            <span class="student-name">${escapeHtml(item.student)}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    renderPrintView(assignments);
  }

  // A4 교실 게시판 인쇄용 뷰 렌더링
  function renderPrintView(assignments) {
    const printTitle = document.getElementById('printClassName');
    const printDate = document.getElementById('printDate');
    const printTbody = document.getElementById('printTableBody');
    const printSummary = document.getElementById('printSummary');

    if (printTitle) printTitle.textContent = `${state.className} 1인 1역할 안내판`;
    if (printDate) printDate.textContent = `배정일: ${new Date().toLocaleDateString('ko-KR')}`;
    if (printSummary) {
      printSummary.textContent = `총 인원: 학생 ${state.students.length}명 / 역할 ${state.roles.length}개`;
    }

    if (!printTbody) return;
    printTbody.innerHTML = '';

    if (!assignments || assignments.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" class="text-center py-4 text-muted">아직 역할이 배정되지 않았습니다. 상단의 [🎲 역할 배정하기] 버튼을 눌러주세요.</td>`;
      printTbody.appendChild(tr);
      return;
    }

    assignments.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="print-no">${idx + 1}</td>
        <td class="print-role">
          <span class="print-icon">${item.role.icon || '⭐'}</span>
          <strong>${escapeHtml(item.role.name)}</strong>
        </td>
        <td class="print-desc">${escapeHtml(item.role.desc || '-')}</td>
        <td class="print-student"><strong>${escapeHtml(item.student)}</strong></td>
        <td class="print-check">□</td>
      `;
      printTbody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 역할 배정 실행 (애니메이션 포함)
  function handleAssign() {
    if (state.isShuffling) return;
    if (state.students.length === 0) {
      showToast('⚠️ 배정할 학생 명단이 없습니다. 먼저 명단을 등록해 주세요.');
      return;
    }
    if (state.roles.length === 0) {
      showToast('⚠️ 배정할 역할이 없습니다. 역할을 먼저 등록해 주세요.');
      return;
    }

    state.isShuffling = true;
    const btn = document.getElementById('btnAssign');
    const diceIcon = document.getElementById('diceIcon');

    if (btn) btn.disabled = true;
    if (diceIcon) diceIcon.classList.add('rolling');

    playSound('dice');

    // 두근두근 롤링 효과
    let counter = 0;
    const maxRolls = 6;
    const interval = setInterval(() => {
      counter++;
      playSound('dice');
      // 임시 무작위 매칭 미리보기
      const tempAssignments = assignRoles(state.students, state.roles);
      renderCards(tempAssignments);

      if (counter >= maxRolls) {
        clearInterval(interval);
        // 최종 배정 확정
        const finalAssignments = assignRoles(state.students, state.roles);
        state.assignments = finalAssignments;
        saveStorage(STORAGE_KEYS.ASSIGNMENTS, finalAssignments);

        state.isShuffling = false;
        if (btn) btn.disabled = false;
        if (diceIcon) diceIcon.classList.remove('rolling');

        renderCards(finalAssignments);
        playSound('success');
        launchConfetti();
        showToast('🎉 역할 배정이 멋지게 완료되었습니다!');
      }
    }, 130);
  }

  // 토스트 메시지 알림
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // 클립보드 복사
  function copyResults() {
    if (!state.assignments || state.assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정한 후 복사해 주세요.');
      return;
    }

    let text = `📋 [${state.className} 1인 1역할 배정 결과]\n`;
    text += `배정일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    text += '------------------------------------\n';
    state.assignments.forEach((item, idx) => {
      text += `${idx + 1}. ${item.role.icon || '⭐'} ${item.role.name} : ${item.student} (${item.role.desc || ''})\n`;
    });
    text += '------------------------------------\n';
    text += '모두 자신의 역할을 책임감 있게 완수해요! ✨';

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 배정 결과가 클립보드에 복사되었습니다! (알림장/메신저에 붙여넣기)');
    }).catch(() => {
      showToast('복사에 실패했습니다. 수동으로 복사해 주세요.');
    });
  }

  // 인쇄 모달 또는 창 열기
  function handlePrint() {
    if (!state.assignments || state.assignments.length === 0) {
      if (!confirm('아직 역할이 배정되지 않았습니다. 빈 양식 그대로 인쇄하시겠습니까?')) {
        return;
      }
    }
    window.print();
  }

  // 모달 제어 함수
  function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // 구글 스프레드시트 불러오기 (Apps Script)
  async function fetchFromSheets() {
    const urlInput = document.getElementById('sheetsUrlInput');
    const url = (urlInput ? urlInput.value.trim() : '') || state.sheetsUrl;

    if (!url) {
      openModal('sheetsModal');
      showToast('💡 구글 Apps Script 웹 앱 URL을 먼저 입력해 주세요.');
      return;
    }

    state.sheetsUrl = url;
    saveStorage(STORAGE_KEYS.SHEETS_URL, url);

    const btn = document.getElementById('btnFetchSheets');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 불러오는 중...';
    }

    try {
      const fullUrl = url.includes('?') ? `${url}&action=getData` : `${url}?action=getData`;
      const response = await fetch(fullUrl, { method: 'GET', mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const result = await response.json();

      const parsed = parseSpreadsheetData(result);
      state.students = parsed.students;
      state.roles = parsed.roles;
      saveStorage(STORAGE_KEYS.STUDENTS, state.students);
      saveStorage(STORAGE_KEYS.ROLES, state.roles);

      closeModal('sheetsModal');
      renderCards(state.assignments);
      showToast(`✅ 시트에서 학생 ${state.students.length}명, 역할 ${state.roles.length}개를 성공적으로 불러왔습니다!`);
    } catch (err) {
      console.warn('Apps Script GET fallback:', err);
      showToast('⚠️ 시트 자동 불러오기 실패: URL과 Apps Script 배포 설정을 확인하거나 아래 CSV/양식을 이용해 주세요.');
      openModal('sheetsModal');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🔄 시트 불러오기';
      }
    }
  }

  // 구글 스프레드시트에 결과 저장 (Apps Script)
  async function saveToSheets() {
    if (!state.assignments || state.assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정해주세요.');
      return;
    }

    const urlInput = document.getElementById('sheetsUrlInput');
    const url = (urlInput ? urlInput.value.trim() : '') || state.sheetsUrl;

    if (!url) {
      openModal('sheetsModal');
      showToast('💡 구글 Apps Script 웹 앱 URL을 먼저 등록해 주세요.');
      return;
    }

    state.sheetsUrl = url;
    saveStorage(STORAGE_KEYS.SHEETS_URL, url);

    const btn = document.getElementById('btnSaveSheets');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> 저장 중...';
    }

    const payload = formatForSpreadsheet(state.assignments, state.className);

    try {
      // Apps Script Web Apps often respond with redirect or CORS.
      // We send json with mode 'cors' or 'no-cors' fallback
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      closeModal('sheetsModal');
      showToast('💾 구글 스프레드시트에 배정 결과가 성공적으로 전송되었습니다!');
    } catch (err) {
      console.warn('Apps Script POST error:', err);
      showToast('⚠️ 시트 자동 전송 실패: CORS 설정이나 Apps Script 배포를 점검해 주세요.');
      openModal('sheetsModal');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '💾 시트에 결과 저장';
      }
    }
  }

  // 학생/역할 편집 모달 채우기
  function populateEditModal() {
    const studentTextarea = document.getElementById('editStudentsText');
    const rolesContainer = document.getElementById('editRolesList');
    const classNameInput = document.getElementById('editClassName');

    if (classNameInput) classNameInput.value = state.className;
    if (studentTextarea) studentTextarea.value = state.students.join('\n');

    if (rolesContainer) {
      rolesContainer.innerHTML = '';
      state.roles.forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = 'edit-role-item';
        item.innerHTML = `
          <input type="text" class="input-icon" value="${escapeHtml(r.icon || '⭐')}" maxlength="2" title="이모지">
          <input type="text" class="input-role-name" value="${escapeHtml(r.name)}" placeholder="역할 이름">
          <input type="text" class="input-role-desc" value="${escapeHtml(r.desc || '')}" placeholder="역할 설명 (임무)">
          <button type="button" class="btn-delete-role" data-idx="${idx}" title="삭제">❌</button>
        `;
        rolesContainer.appendChild(item);
      });
    }
  }

  // 편집된 학생/역할 저장
  function saveEditedData() {
    const studentTextarea = document.getElementById('editStudentsText');
    const rolesContainer = document.getElementById('editRolesList');
    const classNameInput = document.getElementById('editClassName');

    if (classNameInput && classNameInput.value.trim()) {
      state.className = classNameInput.value.trim();
      saveStorage(STORAGE_KEYS.CLASS_NAME, state.className);
      const mainClassTitle = document.getElementById('mainClassTitle');
      if (mainClassTitle) mainClassTitle.textContent = state.className;
    }

    if (studentTextarea) {
      const lines = studentTextarea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      if (lines.length > 0) {
        state.students = lines;
        saveStorage(STORAGE_KEYS.STUDENTS, state.students);
      }
    }

    if (rolesContainer) {
      const items = rolesContainer.querySelectorAll('.edit-role-item');
      const updatedRoles = [];
      const colors = ['mint', 'blue', 'yellow', 'peach', 'lavender', 'pink', 'sky'];

      items.forEach((item, idx) => {
        const icon = item.querySelector('.input-icon').value.trim() || '⭐';
        const name = item.querySelector('.input-role-name').value.trim();
        const desc = item.querySelector('.input-role-desc').value.trim();
        if (name) {
          updatedRoles.push({
            id: String(idx + 1),
            name,
            icon,
            desc,
            color: colors[idx % colors.length]
          });
        }
      });

      if (updatedRoles.length > 0) {
        state.roles = updatedRoles;
        saveStorage(STORAGE_KEYS.ROLES, state.roles);
      }
    }

    closeModal('editModal');
    renderCards(state.assignments);
    showToast('✅ 학생 및 역할 설정이 저장되었습니다!');
  }

  // 초기화 (기본 12명/12역할 복원)
  function resetToDefault() {
    if (!confirm('기본 예시 데이터(학생 12명, 역할 12개)로 초기화하시겠습니까?')) return;
    state.students = [...DEFAULT_STUDENTS];
    state.roles = [...DEFAULT_ROLES];
    state.assignments = [];
    state.className = '햇살초등학교 3학년 2반';
    saveStorage(STORAGE_KEYS.STUDENTS, state.students);
    saveStorage(STORAGE_KEYS.ROLES, state.roles);
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, state.assignments);
    saveStorage(STORAGE_KEYS.CLASS_NAME, state.className);

    const mainClassTitle = document.getElementById('mainClassTitle');
    if (mainClassTitle) mainClassTitle.textContent = state.className;

    renderCards([]);
    populateEditModal();
    showToast('🔄 기본 12명 예시 데이터로 초기화되었습니다.');
  }

  // DOM 로드 시 초기화
  window.addEventListener('DOMContentLoaded', () => {
    // 헤더 학급 이름 반영
    const mainClassTitle = document.getElementById('mainClassTitle');
    if (mainClassTitle) mainClassTitle.textContent = state.className;

    // 시트 URL 인풋 초기값
    const sheetsUrlInput = document.getElementById('sheetsUrlInput');
    if (sheetsUrlInput && state.sheetsUrl) {
      sheetsUrlInput.value = state.sheetsUrl;
    }

    // 카드 초기 렌더링
    renderCards(state.assignments);

    // 이벤트 리스너 바인딩
    const btnAssign = document.getElementById('btnAssign');
    if (btnAssign) btnAssign.addEventListener('click', handleAssign);

    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) btnPrint.addEventListener('click', handlePrint);

    const btnCopy = document.getElementById('btnCopy');
    if (btnCopy) btnCopy.addEventListener('click', copyResults);

    const btnFetchSheets = document.getElementById('btnFetchSheets');
    if (btnFetchSheets) btnFetchSheets.addEventListener('click', fetchFromSheets);

    const btnSaveSheets = document.getElementById('btnSaveSheets');
    if (btnSaveSheets) btnSaveSheets.addEventListener('click', saveToSheets);

    const btnOpenSheetsModal = document.getElementById('btnOpenSheetsModal');
    if (btnOpenSheetsModal) btnOpenSheetsModal.addEventListener('click', () => openModal('sheetsModal'));

    const btnOpenEditModal = document.getElementById('btnOpenEditModal');
    if (btnOpenEditModal) {
      btnOpenEditModal.addEventListener('click', () => {
        populateEditModal();
        openModal('editModal');
      });
    }

    const btnSaveEdit = document.getElementById('btnSaveEdit');
    if (btnSaveEdit) btnSaveEdit.addEventListener('click', saveEditedData);

    const btnResetDefault = document.getElementById('btnResetDefault');
    if (btnResetDefault) btnResetDefault.addEventListener('click', resetToDefault);

    const btnAddRole = document.getElementById('btnAddRole');
    if (btnAddRole) {
      btnAddRole.addEventListener('click', () => {
        const rolesContainer = document.getElementById('editRolesList');
        if (!rolesContainer) return;
        const count = rolesContainer.children.length;
        const item = document.createElement('div');
        item.className = 'edit-role-item';
        item.innerHTML = `
          <input type="text" class="input-icon" value="✨" maxlength="2" title="이모지">
          <input type="text" class="input-role-name" value="새로운 역할 ${count + 1}" placeholder="역할 이름">
          <input type="text" class="input-role-desc" value="맡은 역할을 성실하게 수행해요" placeholder="역할 설명 (임무)">
          <button type="button" class="btn-delete-role" title="삭제">❌</button>
        `;
        rolesContainer.appendChild(item);
      });
    }

    // 모달 닫기 버튼 이벤트 연결
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', e => {
        const modal = el.closest('.modal');
        if (modal) modal.classList.remove('active');
      });
    });

    // 역할 삭제 버튼 이벤트 위임
    const editRolesList = document.getElementById('editRolesList');
    if (editRolesList) {
      editRolesList.addEventListener('click', e => {
        if (e.target.classList.contains('btn-delete-role')) {
          e.target.closest('.edit-role-item').remove();
        }
      });
    }

    // 시트 URL 저장 버튼
    const btnSaveUrl = document.getElementById('btnSaveUrl');
    if (btnSaveUrl) {
      btnSaveUrl.addEventListener('click', () => {
        const input = document.getElementById('sheetsUrlInput');
        if (input) {
          state.sheetsUrl = input.value.trim();
          saveStorage(STORAGE_KEYS.SHEETS_URL, state.sheetsUrl);
          showToast('💾 스프레드시트 URL이 저장되었습니다.');
        }
      });
    }

    // 소리 켜기/끄기
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        state.soundEnabled = !state.soundEnabled;
        soundToggle.textContent = state.soundEnabled ? '🔔 소리 켜짐' : '🔕 소리 꺼짐';
        soundToggle.classList.toggle('muted', !state.soundEnabled);
      });
    }
  });
}
