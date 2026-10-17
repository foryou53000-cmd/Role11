import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleArray,
  assignRoles,
  formatForSpreadsheet,
  parseSpreadsheetResponse,
  DEFAULT_STUDENTS,
  DEFAULT_ROLES,
  DEFAULT_SHEETS_URL
} from '../script.js';

test('DEFAULT_STUDENTS has 12 student objects with num and name', () => {
  assert.equal(DEFAULT_STUDENTS.length, 12);
  assert.equal(typeof DEFAULT_STUDENTS[0], 'object');
  assert.equal(DEFAULT_STUDENTS[0].num, 1);
  assert.equal(DEFAULT_STUDENTS[0].name, '김민준');
  assert.equal(DEFAULT_STUDENTS[1].name, '이서연');
  assert.equal(DEFAULT_STUDENTS[2].name, '박도윤');
  assert.equal(DEFAULT_STUDENTS[3].name, '최지우');
  assert.equal(DEFAULT_STUDENTS[4].name, '정하은');
  assert.equal(DEFAULT_STUDENTS[5].name, '강시우');
});

test('DEFAULT_ROLES has 12 role objects with role and desc fields', () => {
  assert.equal(DEFAULT_ROLES.length, 12);
  assert.equal(typeof DEFAULT_ROLES[0], 'object');
  assert.equal(DEFAULT_ROLES[0].role, '칠판당번');
  assert.equal(DEFAULT_ROLES[0].desc, '칠판을 반짝반짝 깨끗하게 닦아요');
});

test('DEFAULT_SHEETS_URL points to the deployed Apps Script web app URL', () => {
  assert.ok(DEFAULT_SHEETS_URL.includes('macros/s/AKfycby4vaFxQAyMmf84DYyR9BqQmwtLAvcusKyEwLLibHLbnMooGfVy3Fwe8F6G9ylkszR2/exec'));
});

test('shuffleArray returns all original elements in new array without mutating input', () => {
  const original = [{ num: 1, name: '가' }, { num: 2, name: '나' }, { num: 3, name: '다' }];
  const copy = [...original];
  const shuffled = shuffleArray(original);

  assert.equal(shuffled.length, original.length);
  assert.deepEqual(original, copy); // did not mutate
  for (const item of original) {
    assert.ok(shuffled.some(s => s.num === item.num && s.name === item.name));
  }
});

test('assignRoles creates 1:1 matching and preserves student.num, student.name, role.role, role.desc', () => {
  const students = [
    { num: 1, name: '김민준' },
    { num: 2, name: '이서연' },
    { num: 3, name: '박도윤' }
  ];
  const roles = [
    { role: '칠판당번', desc: '칠판 닦기' },
    { role: '우유 도우미', desc: '우유 챙기기' },
    { role: '에너지 지킴이', desc: '불 끄기' }
  ];

  const matches = assignRoles(students, roles);
  assert.equal(matches.length, 3);

  const assignedStudentNames = matches.map(m => m.student.name);
  const assignedRoleNames = matches.map(m => m.role.role);

  // Uniquely assigned
  assert.equal(new Set(assignedStudentNames).size, 3);
  assert.equal(new Set(assignedRoleNames).size, 3);

  // Check no [object Object] strings
  for (const m of matches) {
    assert.notEqual(m.student.name, '[object Object]');
    assert.notEqual(m.role.role, '[object Object]');
    assert.equal(typeof m.student.num, 'number');
    assert.equal(typeof m.student.name, 'string');
    assert.equal(typeof m.role.role, 'string');
    assert.equal(typeof m.role.desc, 'string');
  }
});

test('formatForSpreadsheet formats data for Apps Script POST request with exact required keys', () => {
  const matches = [
    {
      student: { num: 1, name: '김민준' },
      role: { role: '칠판당번', desc: '칠판 닦기' }
    },
    {
      student: { num: 2, name: '이서연' },
      role: { role: '우유 도우미', desc: '우유 챙기기' }
    }
  ];

  const payload = formatForSpreadsheet(matches);
  assert.equal(payload.action, 'saveResults');
  assert.equal(payload.assignments.length, 2);

  assert.deepEqual(payload.assignments[0], {
    num: 1,
    name: '김민준',
    role: '칠판당번',
    desc: '칠판 닦기'
  });

  assert.deepEqual(payload.assignments[1], {
    num: 2,
    name: '이서연',
    role: '우유 도우미',
    desc: '우유 챙기기'
  });
});

test('parseSpreadsheetResponse successfully parses valid Apps Script GET payload', () => {
  const mockGasResponse = {
    status: 'success',
    students: [
      { num: 1, name: '김민준' },
      { num: 2, name: '이서연' }
    ],
    roles: [
      { role: '칠판당번', desc: '칠판 닦기' },
      { role: '우유 도우미', desc: '우유 챙기기' }
    ],
    results: [
      { date: '2026-10-17 09:00', num: 1, name: '김민준', role: '칠판당번', desc: '칠판 닦기' },
      { date: '2026-10-17 09:00', num: 2, name: '이서연', role: '우유 도우미', desc: '우유 챙기기' }
    ]
  };

  const parsed = parseSpreadsheetResponse(mockGasResponse);
  assert.equal(parsed.students.length, 2);
  assert.equal(parsed.students[0].name, '김민준');
  assert.equal(parsed.students[0].num, 1);
  assert.equal(parsed.roles.length, 2);
  assert.equal(parsed.roles[0].role, '칠판당번');
  assert.equal(parsed.roles[0].desc, '칠판 닦기');
  assert.equal(parsed.assignments.length, 2);
  assert.equal(parsed.assignments[0].student.name, '김민준');
  assert.equal(parsed.assignments[0].role.role, '칠판당번');
});

test('parseSpreadsheetResponse throws on error status, non-object or malformed names', () => {
  assert.throws(() => {
    parseSpreadsheetResponse({ status: 'error', message: 'Failed to read sheet' });
  });

  assert.throws(() => {
    parseSpreadsheetResponse({ status: 'success', students: 'not an array', roles: [] });
  });

  // Malformed rows where name is an object should be filtered out
  const withMalformed = {
    status: 'success',
    students: [
      { num: 1, name: '김민준' },
      { num: 2, name: { invalid: true } }, // invalid
      { num: 3, name: '' } // empty
    ],
    roles: [
      { role: '칠판당번', desc: '칠판 닦기' }
    ]
  };
  const parsed = parseSpreadsheetResponse(withMalformed);
  assert.equal(parsed.students.length, 1);
  assert.equal(parsed.students[0].name, '김민준');
});
