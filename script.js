/**
 * 학급 1인 1역할 배정기 - script.js
 * 초등학생 눈높이에 맞춘 랜덤 역할 배정, A4 인쇄 및 구글 스프레드시트(Apps Script) 연동
 */

export const DEFAULT_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycby4vaFxQAyMmf84DYyR9BqQmwtLAvcusKyEwLLibHLbnMooGfVy3Fwe8F6G9ylkszR2/exec';

// 기본 학생 명단 (객체 배열: { num, name })
export const DEFAULT_STUDENTS = [
  { num: 1, name: '김민준' },
  { num: 2, name: '이서연' },
  { num: 3, name: '박도윤' },
  { num: 4, name: '최지우' },
  { num: 5, name: '정하은' },
  { num: 6, name: '강시우' },
  { num: 7, name: '윤도현' },
  { num: 8, name: '조예린' },
  { num: 9, name: '임준우' },
  { num: 10, name: '한수아' },
  { num: 11, name: '오지호' },
  { num: 12, name: '배유진' }
];

// 기본 역할 목록 (객체 배열: { role, desc, icon, partner, color })
export const DEFAULT_ROLES = [
  { role: '칠판당번', desc: '칠판을 반짝반짝 깨끗하게 닦아요', icon: '🧹', partner: '꼬부기 💧', color: 'water' },
  { role: '우유 도우미', desc: '시원하고 맛있는 우유를 챙겨줘요', icon: '🥛', partner: '피카츄 ⚡', color: 'electric' },
  { role: '에너지 지킴이', desc: '나갈 때 전등과 냉난방기를 꺼요', icon: '💡', partner: '파이리 🔥', color: 'fire' },
  { role: '줄서기 반장', desc: '이동할 때 바른 걸음으로 줄을 이끌어요', icon: '🚶', partner: '이상해씨 🍃', color: 'grass' },
  { role: '도서 정리왕', desc: '학급 문고 책을 바르게 꽂아요', icon: '📚', partner: '이브이 🌿', color: 'wood' },
  { role: '분리수거 요원', desc: '재활용 쓰레기를 바르게 분류해요', icon: '♻️', partner: '디그다 🪵', color: 'earth' },
  { role: '창문 환기 요정', desc: '쉬는 시간마다 상쾌한 공기를 선물해요', icon: '🪟', partner: '버터플 🦋', color: 'wind' },
  { role: '학습지 도우미', desc: '선생님 학습지와 알림장을 나눠줘요', icon: '📑', partner: '메타몽 🌸', color: 'fairy' },
  { role: '화분 사랑단', desc: '교실 화분에 물을 주고 사랑을 줘요', icon: '🌱', partner: '뚜벅쵸 🌷', color: 'flower' },
  { role: '보건 위생 지킴이', desc: '깨끗한 손 씻기와 위생을 안내해요', icon: '🧼', partner: '럭키 💖', color: 'care' },
  { role: '컴퓨터·TV 관리관', desc: '수업 후 전자칠판과 컴퓨터를 확인해요', icon: '💻', partner: '코일 ⚙️', color: 'tech' },
  { role: '칭찬 배달원', desc: '친구들에게 고운 말과 칭찬을 전해요', icon: '💌', partner: '토게피 🥚', color: 'sunny' }
];

// 역할명에 따른 아이콘/파트너 매핑 헬퍼
export function getRoleIcon(roleName) {
  const match = DEFAULT_ROLES.find(r => r.role === roleName);
  if (match) return match.icon;
  if (/칠판/i.test(roleName)) return '🧹';
  if (/우유/i.test(roleName)) return '🥛';
  if (/전등|불|에너지/i.test(roleName)) return '💡';
  if (/줄|반장/i.test(roleName)) return '🚶';
  if (/책|도서/i.test(roleName)) return '📚';
  if (/쓰레기|분리수거/i.test(roleName)) return '♻️';
  if (/창문|환기/i.test(roleName)) return '🪟';
  if (/학습지|알림장/i.test(roleName)) return '📑';
  if (/식물|화분/i.test(roleName)) return '🌱';
  if (/보건|위생|소독/i.test(roleName)) return '🧼';
  if (/컴퓨터|tv|기기/i.test(roleName)) return '💻';
  if (/칭찬|배려/i.test(roleName)) return '💌';
  return '⭐';
}

export function getRolePartner(roleName) {
  const match = DEFAULT_ROLES.find(r => r.role === roleName);
  if (match) return match.partner;
  return '포코피아 프렌즈';
}

// Fisher-Yates 무작위 셔플 알고리즘
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 학생(객체)과 역할(객체) 1:1 무작위 배정 로직
export function assignRoles(students, roles) {
  if (!students || students.length === 0) return [];
  if (!roles || roles.length === 0) return [];

  const shuffledStudents = shuffleArray(students);
  const shuffledRoles = shuffleArray(roles);

  const count = Math.max(shuffledStudents.length, shuffledRoles.length);
  const assignments = [];
  const defaultColors = ['water', 'electric', 'fire', 'grass', 'wood', 'earth', 'wind', 'fairy', 'flower', 'care', 'tech', 'sunny'];

  for (let i = 0; i < count; i++) {
    const s = shuffledStudents[i % shuffledStudents.length];
    const r = shuffledRoles[i % shuffledRoles.length];

    const studentObj = {
      num: typeof s.num === 'number' ? s.num : (parseInt(s.num, 10) || (i + 1)),
      name: typeof s.name === 'string' ? s.name : String(s.name || '')
    };

    const roleName = typeof r.role === 'string' ? r.role : (r.name || `역할 ${i + 1}`);
    const roleObj = {
      role: roleName,
      desc: typeof r.desc === 'string' ? r.desc : '',
      icon: r.icon || getRoleIcon(roleName),
      partner: r.partner || getRolePartner(roleName),
      color: r.color || defaultColors[i % defaultColors.length]
    };

    assignments.push({
      id: i + 1,
      student: studentObj,
      role: roleObj
    });
  }

  return assignments;
}

// 구글 스프레드시트(Apps Script) POST 전송용 데이터 포맷
// 필수 규격: body: JSON.stringify({ action: "saveResults", assignments: [...] })
// 각 항목은 { num: student.num, name: student.name, role: selectedRole.role, desc: selectedRole.desc }
export function formatForSpreadsheet(assignments) {
  const formattedAssignments = (assignments || []).map(item => {
    const studentNum = typeof item.student?.num === 'number'
      ? item.student.num
      : (typeof item.num === 'number' ? item.num : 0);

    const studentName = typeof item.student?.name === 'string'
      ? item.student.name
      : (typeof item.name === 'string' ? item.name : '');

    const roleName = typeof item.role?.role === 'string'
      ? item.role.role
      : (typeof item.role?.name === 'string' ? item.role.name : (typeof item.role === 'string' ? item.role : ''));

    const roleDesc = typeof item.role?.desc === 'string'
      ? item.role.desc
      : (typeof item.desc === 'string' ? item.desc : '');

    return {
      num: studentNum,
      name: studentName,
      role: roleName,
      desc: roleDesc
    };
  });

  return {
    action: 'saveResults',
    assignments: formattedAssignments
  };
}

// 구글 시트 Apps Script GET 응답 파싱 및 검증
// 형식: { status: "success", students: [{ num: 1, name: "김민준" }], roles: [{ role: "칠판당번", desc: "칠판 닦기" }], results: [...] }
export function parseSpreadsheetResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('응답 데이터가 올바른 JSON 객체 형식이 아닙니다.');
  }

  if (data.status !== 'success') {
    throw new Error(data.message || '스프레드시트에서 정상 상태(status: success)를 반환하지 않았습니다.');
  }

  if (!Array.isArray(data.students)) {
    throw new Error('students 데이터가 배열 형식이 아닙니다.');
  }

  if (!Array.isArray(data.roles)) {
    throw new Error('roles 데이터가 배열 형식이 아닙니다.');
  }

  const defaultColors = ['water', 'electric', 'fire', 'grass', 'wood', 'earth', 'wind', 'fairy', 'flower', 'care', 'tech', 'sunny'];

  // 학생 검증 및 정제
  const validStudents = [];
  data.students.forEach((s, idx) => {
    if (!s || typeof s !== 'object') return;
    if (typeof s.name !== 'string' || !s.name.trim()) return;

    const num = typeof s.num === 'number' ? s.num : (parseInt(s.num, 10) || (idx + 1));
    validStudents.push({
      num,
      name: s.name.trim()
    });
  });

  // 역할 검증 및 정제
  const validRoles = [];
  data.roles.forEach((r, idx) => {
    if (!r || typeof r !== 'object') return;
    const roleName = typeof r.role === 'string' ? r.role.trim() : (typeof r.name === 'string' ? r.name.trim() : '');
    if (!roleName) return;

    const desc = typeof r.desc === 'string' ? r.desc.trim() : '';
    validRoles.push({
      role: roleName,
      desc,
      icon: r.icon || getRoleIcon(roleName),
      partner: r.partner || getRolePartner(roleName),
      color: r.color || defaultColors[idx % defaultColors.length]
    });
  });

  if (validStudents.length === 0) {
    throw new Error('가져온 데이터에 유효한 학생 명단이 없습니다.');
  }

  if (validRoles.length === 0) {
    throw new Error('가져온 데이터에 유효한 역할 목록이 없습니다.');
  }

  // 이전 배정 결과(results)가 시트에 기록되어 있는 경우 복원
  let parsedAssignments = null;
  if (Array.isArray(data.results) && data.results.length > 0) {
    parsedAssignments = [];
    data.results.forEach((res, idx) => {
      if (!res || typeof res !== 'object') return;
      if (typeof res.name !== 'string' || !res.name.trim()) return;
      const roleStr = typeof res.role === 'string' ? res.role.trim() : '';
      if (!roleStr) return;

      parsedAssignments.push({
        id: idx + 1,
        student: {
          num: typeof res.num === 'number' ? res.num : (parseInt(res.num, 10) || (idx + 1)),
          name: res.name.trim()
        },
        role: {
          role: roleStr,
          desc: typeof res.desc === 'string' ? res.desc.trim() : '',
          icon: res.icon || getRoleIcon(roleStr),
          partner: res.partner || getRolePartner(roleStr),
          color: defaultColors[idx % defaultColors.length]
        },
        date: typeof res.date === 'string' ? res.date : ''
      });
    });
  }

  return {
    students: validStudents,
    roles: validRoles,
    assignments: parsedAssignments
  };
}

/* ==========================================================================
   브라우저 인터랙션 및 UI 제어 (DOM 초기화 및 이벤트 연결)
   ========================================================================== */

if (typeof window !== 'undefined') {
  const STORAGE_KEYS = {
    STUDENTS: 'class_role_students_v2',
    ROLES: 'class_role_roles_v2',
    ASSIGNMENTS: 'class_role_assignments_v2',
    CLASS_NAME: 'class_role_classname',
    SHEETS_URL: 'class_role_sheets_url'
  };

  function loadStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      if (!saved) return fallback;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
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

  // 상태 관리 객체
  const state = {
    className: localStorage.getItem(STORAGE_KEYS.CLASS_NAME) || '햇살초등학교 3학년 2반',
    students: loadStorage(STORAGE_KEYS.STUDENTS, DEFAULT_STUDENTS),
    roles: loadStorage(STORAGE_KEYS.ROLES, DEFAULT_ROLES),
    assignments: loadStorage(STORAGE_KEYS.ASSIGNMENTS, []),
    sheetsUrl: localStorage.getItem(STORAGE_KEYS.SHEETS_URL) || DEFAULT_SHEETS_URL,
    isShuffling: false,
    soundEnabled: true
  };

  // 포코피아 웹 오디오 효과음
  function playSound(type, index = 0) {
    if (!state.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      if (type === 'dice') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'pop') {
        const notes = [
          523.25, 587.33, 659.25, 698.46, 783.99, 880.00,
          987.77, 1046.50, 1174.66, 1318.51, 1396.91, 1567.98
        ];
        const freq = notes[index % notes.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start();
        osc.stop(ctx.currentTime + 0.22);
      } else if (type === 'fanfare') {
        const fanfareNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        fanfareNotes.forEach((freq, idx) => {
          const noteOsc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteOsc.connect(noteGain);
          noteGain.connect(ctx.destination);
          noteOsc.type = 'triangle';
          noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
          noteGain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.07);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.35);
          noteOsc.start(ctx.currentTime + idx * 0.07);
          noteOsc.stop(ctx.currentTime + idx * 0.07 + 0.35);
        });
      }
    } catch {
      // AudioContext unavailable
    }
  }

  // 꽃가루(Confetti) 효과
  function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#7AC74F', '#A7E972', '#FFB5A7', '#FCD5CE', '#48CAE4', '#90E0EF', '#FFE66D', '#FF6B6B'];
    const particles = Array.from({ length: 110 }).map(() => ({
      x: canvas.width / 2,
      y: canvas.height * 0.42,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.75) * 16,
      size: Math.random() * 9 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      life: 1
    }));

    let animationFrame;
    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28;
        p.rotation += p.vRot;
        p.life -= 0.011;

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

  // 카드 렌더링 (textContent 활용하여 안전하고 확실하게 출력)
  function renderCards(assignments, isStaggered = false) {
    const grid = document.getElementById('cardsGrid');
    const emptyState = document.getElementById('emptyState');
    const statusBadge = document.getElementById('statusBadge');
    const studentCountEl = document.getElementById('studentCount');
    const roleCountEl = document.getElementById('roleCount');
    const btn = document.getElementById('btnAssign');
    const diceIcon = document.getElementById('diceIcon');

    if (studentCountEl) studentCountEl.textContent = String(state.students.length);
    if (roleCountEl) roleCountEl.textContent = String(state.roles.length);

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
    grid.innerHTML = '';

    const staggerStepMs = 85;

    assignments.forEach((item, index) => {
      const card = document.createElement('div');
      const color = item.role?.color || 'grass';
      card.className = `role-card habitat-${color} ${isStaggered ? 'stagger-card' : ''}`;
      card.setAttribute('data-id', String(item.id || index + 1));
      card.style.setProperty('--stagger-idx', String(index));

      // 헤더
      const cardHeader = document.createElement('div');
      cardHeader.className = 'card-header';

      const roleBadge = document.createElement('span');
      roleBadge.className = 'role-badge';
      roleBadge.textContent = `역할 #${String(index + 1).padStart(2, '0')}`;
      cardHeader.appendChild(roleBadge);

      if (item.role?.partner) {
        const partnerBadge = document.createElement('span');
        partnerBadge.className = 'partner-badge';
        partnerBadge.textContent = item.role.partner;
        cardHeader.appendChild(partnerBadge);
      }

      const cardIcon = document.createElement('span');
      cardIcon.className = 'card-icon';
      cardIcon.setAttribute('aria-hidden', 'true');
      cardIcon.textContent = item.role?.icon || '⭐';
      cardHeader.appendChild(cardIcon);

      card.appendChild(cardHeader);

      // 역할 이름
      const roleTitle = document.createElement('div');
      roleTitle.className = 'card-role-title';
      roleTitle.textContent = item.role?.role || item.role?.name || `역할 ${index + 1}`;
      card.appendChild(roleTitle);

      // 역할 설명
      const roleDesc = document.createElement('div');
      roleDesc.className = 'card-desc';
      roleDesc.textContent = item.role?.desc || '';
      card.appendChild(roleDesc);

      // 구분선
      const divider = document.createElement('div');
      divider.className = 'card-divider';
      card.appendChild(divider);

      // 담당 학생 박스
      const studentBox = document.createElement('div');
      studentBox.className = 'assigned-student-box';

      const studentLabel = document.createElement('span');
      studentLabel.className = 'student-label';
      studentLabel.textContent = '담당 친구';
      studentBox.appendChild(studentLabel);

      const nameWrapper = document.createElement('div');
      nameWrapper.className = 'student-name-wrapper';

      const avatar = document.createElement('span');
      avatar.className = 'student-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = '🧢';
      nameWrapper.appendChild(avatar);

      const studentNameEl = document.createElement('span');
      studentNameEl.className = 'student-name';
      const numPrefix = item.student?.num ? `${item.student.num}번 ` : '';
      studentNameEl.textContent = `${numPrefix}${item.student?.name || ''}`;
      nameWrapper.appendChild(studentNameEl);

      studentBox.appendChild(nameWrapper);
      card.appendChild(studentBox);

      grid.appendChild(card);

      if (isStaggered) {
        setTimeout(() => {
          playSound('pop', index);
        }, index * staggerStepMs);
      }
    });

    if (isStaggered) {
      if (statusBadge) {
        statusBadge.textContent = '🎲 순차 배정 중...';
        statusBadge.className = 'status-badge shuffling';
      }

      const totalDuration = assignments.length * staggerStepMs + 300;
      setTimeout(() => {
        if (statusBadge) {
          statusBadge.textContent = `🎉 ${assignments.length}명 배정 완료!`;
          statusBadge.className = 'status-badge done';
        }
        state.isShuffling = false;
        if (btn) btn.disabled = false;
        if (diceIcon) diceIcon.classList.remove('rolling');

        playSound('fanfare');
        launchConfetti();
        showToast(`🎉 포코피아 마을 ${assignments.length}명의 역할이 멋지게 배정되었습니다!`);
      }, totalDuration);
    } else {
      if (statusBadge) {
        statusBadge.textContent = `🎉 ${assignments.length}명 배정 완료!`;
        statusBadge.className = 'status-badge done';
      }
      state.isShuffling = false;
      if (btn) btn.disabled = false;
      if (diceIcon) diceIcon.classList.remove('rolling');
    }

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
      const td = document.createElement('td');
      td.colSpan = 5;
      td.className = 'text-center py-4 text-muted';
      td.textContent = '아직 역할이 배정되지 않았습니다. 상단의 [🎲 역할 배정하기] 버튼을 눌러주세요.';
      tr.appendChild(td);
      printTbody.appendChild(tr);
      return;
    }

    assignments.forEach((item, idx) => {
      const tr = document.createElement('tr');

      const tdNo = document.createElement('td');
      tdNo.className = 'print-no';
      tdNo.textContent = String(idx + 1);
      tr.appendChild(tdNo);

      const tdRole = document.createElement('td');
      tdRole.className = 'print-role';

      const iconSpan = document.createElement('span');
      iconSpan.className = 'print-icon';
      iconSpan.textContent = item.role?.icon || '⭐';
      tdRole.appendChild(iconSpan);

      const roleStrong = document.createElement('strong');
      roleStrong.textContent = item.role?.role || item.role?.name || '';
      tdRole.appendChild(roleStrong);

      if (item.role?.partner) {
        const partnerSmall = document.createElement('small');
        partnerSmall.className = 'print-partner-label';
        partnerSmall.textContent = ` (${item.role.partner})`;
        tdRole.appendChild(partnerSmall);
      }
      tr.appendChild(tdRole);

      const tdDesc = document.createElement('td');
      tdDesc.className = 'print-desc';
      tdDesc.textContent = item.role?.desc || '-';
      tr.appendChild(tdDesc);

      const tdStudent = document.createElement('td');
      tdStudent.className = 'print-student';
      const studentStrong = document.createElement('strong');
      const numPrefix = item.student?.num ? `${item.student.num}번 ` : '';
      studentStrong.textContent = `${numPrefix}${item.student?.name || ''}`;
      tdStudent.appendChild(studentStrong);
      tr.appendChild(tdStudent);

      const tdCheck = document.createElement('td');
      tdCheck.className = 'print-check';
      tdCheck.textContent = '□';
      tr.appendChild(tdCheck);

      printTbody.appendChild(tr);
    });
  }

  // 역할 배정 실행
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

    setTimeout(() => {
      const finalAssignments = assignRoles(state.students, state.roles);
      state.assignments = finalAssignments;
      saveStorage(STORAGE_KEYS.ASSIGNMENTS, finalAssignments);

      renderCards(finalAssignments, true);
    }, 450);
  }

  // 토스트 메시지
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // 클립보드 복사
  function copyResults() {
    if (!state.assignments || state.assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정한 후 복사해 주세요.');
      return;
    }

    let text = `📋 [${state.className} 1인 1역할 배정표]\n`;
    text += `배정일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    text += '------------------------------------\n';
    state.assignments.forEach((item, idx) => {
      const partner = item.role?.partner ? ` [${item.role.partner}]` : '';
      const numPrefix = item.student?.num ? `${item.student.num}번 ` : '';
      text += `${idx + 1}. ${item.role?.icon || '⭐'} ${item.role?.role || ''}${partner} : ${numPrefix}${item.student?.name || ''} (${item.role?.desc || ''})\n`;
    });
    text += '------------------------------------\n';
    text += '모두 자신의 역할을 책임감 있게 완수해요! ✨';

    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 배정 결과가 클립보드에 복사되었습니다! (알림장/메신저에 붙여넣기)');
    }).catch(() => {
      showToast('복사에 실패했습니다. 수동으로 복사해 주세요.');
    });
  }

  function handlePrint() {
    if (!state.assignments || state.assignments.length === 0) {
      if (!confirm('아직 역할이 배정되지 않았습니다. 빈 양식 그대로 인쇄하시겠습니까?')) {
        return;
      }
    }
    window.print();
  }

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

  // ==========================================================================
  // 구글 스프레드시트(Apps Script) 데이터 불러오기 (GET 요청)
  // ==========================================================================
  async function fetchFromSheets(silent = false) {
    const url = state.sheetsUrl || DEFAULT_SHEETS_URL;

    if (!url) {
      if (!silent) {
        openModal('sheetsModal');
        showToast('💡 구글 Apps Script 웹 앱 URL을 먼저 입력해 주세요.');
      }
      return;
    }

    const btn = document.getElementById('btnFetchSheets');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '🔄 불러오는 중...';
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP 상태 코드 ${response.status} 오류가 발생했습니다.`);
      }

      const result = await response.json();
      const parsed = parseSpreadsheetResponse(result);

      // 성공 시 데이터 반영
      state.students = parsed.students;
      state.roles = parsed.roles;
      saveStorage(STORAGE_KEYS.STUDENTS, state.students);
      saveStorage(STORAGE_KEYS.ROLES, state.roles);

      if (parsed.assignments && parsed.assignments.length > 0) {
        state.assignments = parsed.assignments;
        saveStorage(STORAGE_KEYS.ASSIGNMENTS, state.assignments);
      }

      renderCards(state.assignments);
      showToast(`✅ 시트에서 학생 ${state.students.length}명, 역할 ${state.roles.length}개를 성공적으로 불러왔습니다!`);
    } catch (err) {
      console.warn('Apps Script GET error:', err);
      if (!silent) {
        showToast(`⚠️ 시트 불러오기 오류: ${err.message || '네트워크 상태를 확인해 주세요.'}`);
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🔄 시트에서 명단/결과 불러오기';
      }
    }
  }

  // ==========================================================================
  // 구글 스프레드시트(Apps Script) 결과 저장하기 (POST 요청 - CORS 에러 방지)
  // ==========================================================================
  async function saveToSheets() {
    if (!state.assignments || state.assignments.length === 0) {
      showToast('⚠️ 먼저 역할을 배정해 주세요.');
      return;
    }

    const url = state.sheetsUrl || DEFAULT_SHEETS_URL;
    if (!url) {
      openModal('sheetsModal');
      showToast('💡 구글 Apps Script 웹 앱 URL을 먼저 등록해 주세요.');
      return;
    }

    const btn = document.getElementById('btnSaveSheets');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '💾 저장 중...';
    }

    // CORS preflight를 유발하지 않도록 text/plain 헤더 필수 적용
    const payload = formatForSpreadsheet(state.assignments);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${response.status})`);
      }

      let responseJson = null;
      try {
        responseJson = await response.json();
      } catch {
        // 일부 Apps Script는 단순 문자열 "OK" 반환
      }

      if (responseJson && responseJson.status && responseJson.status !== 'success') {
        throw new Error(responseJson.message || '시트 저장 처리에 실패했습니다.');
      }

      showToast('💾 구글 스프레드시트에 배정 결과가 안전하게 저장되었습니다!');
      playSound('fanfare');
    } catch (err) {
      console.warn('Apps Script POST error:', err);
      showToast(`⚠️ 시트 저장 오류: ${err.message || 'CORS 설정이나 웹앱 권한을 확인해 주세요.'}`);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '💾 배정 결과 구글 시트에 저장';
      }
    }
  }

  // 학생/역할 편집 모달 채우기
  function populateEditModal() {
    const studentTextarea = document.getElementById('editStudentsText');
    const rolesContainer = document.getElementById('editRolesList');
    const classNameInput = document.getElementById('editClassName');

    if (classNameInput) classNameInput.value = state.className;
    if (studentTextarea) {
      // 텍스트 영역에는 students.map(s => s.name).join('\n') 로 문자열 필드만 표시
      studentTextarea.value = state.students.map(s => s.name).join('\n');
    }

    if (rolesContainer) {
      rolesContainer.innerHTML = '';
      state.roles.forEach((r, idx) => {
        const item = document.createElement('div');
        item.className = 'edit-role-item';

        const iconInput = document.createElement('input');
        iconInput.type = 'text';
        iconInput.className = 'input-icon';
        iconInput.value = r.icon || '⭐';
        iconInput.maxLength = 2;
        iconInput.title = '이모지';
        item.appendChild(iconInput);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'input-role-name';
        nameInput.value = r.role;
        nameInput.placeholder = '역할 이름';
        item.appendChild(nameInput);

        const descInput = document.createElement('input');
        descInput.type = 'text';
        descInput.className = 'input-role-desc';
        descInput.value = r.desc || '';
        descInput.placeholder = '역할 설명 (임무)';
        item.appendChild(descInput);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn-delete-role';
        delBtn.dataset.idx = String(idx);
        delBtn.title = '삭제';
        delBtn.textContent = '❌';
        item.appendChild(delBtn);

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
        const updatedStudents = lines.map((name, i) => {
          // 기존 학생과 이름이 같으면 기존 번호 보존
          const existing = state.students[i];
          const num = existing && existing.name === name ? existing.num : (i + 1);
          return { num, name };
        });

        state.students = updatedStudents;
        saveStorage(STORAGE_KEYS.STUDENTS, state.students);
      }
    }

    if (rolesContainer) {
      const items = rolesContainer.querySelectorAll('.edit-role-item');
      const updatedRoles = [];
      const defaultColors = ['water', 'electric', 'fire', 'grass', 'wood', 'earth', 'wind', 'fairy', 'flower', 'care', 'tech', 'sunny'];

      items.forEach((item, idx) => {
        const icon = item.querySelector('.input-icon').value.trim() || '⭐';
        const roleName = item.querySelector('.input-role-name').value.trim();
        const desc = item.querySelector('.input-role-desc').value.trim();
        if (roleName) {
          const original = state.roles[idx];
          updatedRoles.push({
            role: roleName,
            desc,
            icon,
            partner: original?.partner || getRolePartner(roleName),
            color: original?.color || defaultColors[idx % defaultColors.length]
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

  // 초기화 (기본 데이터 복원)
  function resetToDefault() {
    if (!confirm('기본 예시 데이터(학생 12명, 역할 12개)로 초기화하시겠습니까?')) return;
    state.students = [...DEFAULT_STUDENTS];
    state.roles = [...DEFAULT_ROLES];
    state.assignments = [];
    state.className = '햇살초등학교 3학년 2반';
    state.sheetsUrl = DEFAULT_SHEETS_URL;

    saveStorage(STORAGE_KEYS.STUDENTS, state.students);
    saveStorage(STORAGE_KEYS.ROLES, state.roles);
    saveStorage(STORAGE_KEYS.ASSIGNMENTS, state.assignments);
    saveStorage(STORAGE_KEYS.CLASS_NAME, state.className);
    saveStorage(STORAGE_KEYS.SHEETS_URL, state.sheetsUrl);

    const mainClassTitle = document.getElementById('mainClassTitle');
    if (mainClassTitle) mainClassTitle.textContent = state.className;

    const urlInput = document.getElementById('sheetsUrlInput');
    if (urlInput) urlInput.value = state.sheetsUrl;

    renderCards([]);
    populateEditModal();
    showToast('🔄 기본 12명 예시 데이터로 초기화되었습니다.');
  }

  // DOM 로드 시 초기화 및 시트 자동 동기화
  window.addEventListener('DOMContentLoaded', () => {
    const mainClassTitle = document.getElementById('mainClassTitle');
    if (mainClassTitle) mainClassTitle.textContent = state.className;

    const sheetsUrlInput = document.getElementById('sheetsUrlInput');
    if (sheetsUrlInput) {
      sheetsUrlInput.value = state.sheetsUrl || DEFAULT_SHEETS_URL;
    }

    renderCards(state.assignments);

    // 이벤트 리스너 바인딩
    const btnAssign = document.getElementById('btnAssign');
    if (btnAssign) btnAssign.addEventListener('click', handleAssign);

    const btnPrint = document.getElementById('btnPrint');
    if (btnPrint) btnPrint.addEventListener('click', handlePrint);

    const btnCopy = document.getElementById('btnCopy');
    if (btnCopy) btnCopy.addEventListener('click', copyResults);

    const btnFetchSheets = document.getElementById('btnFetchSheets');
    if (btnFetchSheets) btnFetchSheets.addEventListener('click', () => fetchFromSheets(false));

    const btnSaveSheets = document.getElementById('btnSaveSheets');
    if (btnSaveSheets) btnSaveSheets.addEventListener('click', saveToSheets);

    const btnOpenSheetsModal = document.getElementById('btnOpenSheetsModal');
    if (btnOpenSheetsModal) {
      btnOpenSheetsModal.addEventListener('click', () => {
        if (sheetsUrlInput) sheetsUrlInput.value = state.sheetsUrl || DEFAULT_SHEETS_URL;
        openModal('sheetsModal');
      });
    }

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
          <input type="text" class="input-role-name" value="새 역할 ${count + 1}" placeholder="역할 이름">
          <input type="text" class="input-role-desc" value="맡은 역할을 성실하게 수행해요" placeholder="역할 설명 (임무)">
          <button type="button" class="btn-delete-role" title="삭제">❌</button>
        `;
        rolesContainer.appendChild(item);
      });
    }

    // 모달 닫기
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', () => {
        const modal = el.closest('.modal');
        if (modal) modal.classList.remove('active');
      });
    });

    // 역할 삭제 위임
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
        if (input && input.value.trim()) {
          state.sheetsUrl = input.value.trim();
          saveStorage(STORAGE_KEYS.SHEETS_URL, state.sheetsUrl);
          closeModal('sheetsModal');
          showToast('💾 스프레드시트 URL이 안전하게 저장되었습니다!');
          fetchFromSheets(false);
        } else {
          showToast('⚠️ 올바른 웹앱 URL을 입력해 주세요.');
        }
      });
    }

    // 시트 연결 테스트 버튼
    const btnTestSheets = document.getElementById('btnTestSheets');
    if (btnTestSheets) {
      btnTestSheets.addEventListener('click', async () => {
        const input = document.getElementById('sheetsUrlInput');
        const testUrl = (input ? input.value.trim() : '') || state.sheetsUrl;
        if (!testUrl) {
          showToast('⚠️ 테스트할 URL을 입력해 주세요.');
          return;
        }

        btnTestSheets.disabled = true;
        btnTestSheets.textContent = '연결 확인 중...';

        try {
          const res = await fetch(testUrl, { method: 'GET', headers: { 'Accept': 'application/json' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = await res.json();
          if (json.status === 'success') {
            showToast(`✅ 연결 성공! 학생 ${json.students?.length || 0}명, 역할 ${json.roles?.length || 0}개 확인`);
          } else {
            showToast(`⚠️ 서버 응답: ${json.message || '상태 확인 필요'}`);
          }
        } catch (err) {
          showToast(`❌ 연결 실패: ${err.message || 'URL 또는 CORS 권한 확인'}`);
        } finally {
          btnTestSheets.disabled = false;
          btnTestSheets.textContent = '🔗 연결 테스트';
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

    // 페이지 진입 시 자동으로 구글 시트 데이터 불러오기 시도
    fetchFromSheets(true);
  });
}
