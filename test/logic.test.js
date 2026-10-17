import test from 'node:test';
import assert from 'node:assert/strict';
import {
  shuffleArray,
  assignRoles,
  formatForSpreadsheet,
  parseSpreadsheetData,
  DEFAULT_STUDENTS,
  DEFAULT_ROLES
} from '../script.js';

test('DEFAULT_STUDENTS has 12 students and DEFAULT_ROLES has 12 roles', () => {
  assert.equal(DEFAULT_STUDENTS.length, 12);
  assert.equal(DEFAULT_ROLES.length, 12);
});

test('shuffleArray returns all original elements in new array without mutating input', () => {
  const original = ['가', '나', '다', '라', '마'];
  const copy = [...original];
  const shuffled = shuffleArray(original);

  assert.equal(shuffled.length, original.length);
  assert.deepEqual(original, copy); // did not mutate
  // Shuffled should have all elements
  for (const item of original) {
    assert.ok(shuffled.includes(item));
  }
});

test('assignRoles creates 1:1 matching for equal number of students and roles', () => {
  const students = ['김민준', '이서아', '박도윤'];
  const roles = [
    { id: '1', name: '칠판 지우미', icon: '🧹', desc: '칠판 닦기' },
    { id: '2', name: '우유 도우미', icon: '🥛', desc: '우유 챙기기' },
    { id: '3', name: '에너지 지킴이', icon: '💡', desc: '불 끄기' }
  ];

  const matches = assignRoles(students, roles);
  assert.equal(matches.length, 3);

  const assignedStudents = matches.map(m => m.student);
  const assignedRoles = matches.map(m => m.role.name);

  // Every student must be assigned uniquely
  assert.equal(new Set(assignedStudents).size, 3);
  for (const s of students) {
    assert.ok(assignedStudents.includes(s));
  }

  // Every role must be assigned uniquely
  assert.equal(new Set(assignedRoles).size, 3);
  for (const r of roles) {
    assert.ok(assignedRoles.includes(r.name));
  }
});

test('assignRoles handles more students than roles gracefully', () => {
  const students = ['A', 'B', 'C', 'D'];
  const roles = [
    { id: '1', name: '역할1', icon: '⭐', desc: '' },
    { id: '2', name: '역할2', icon: '✨', desc: '' }
  ];
  const matches = assignRoles(students, roles);
  assert.equal(matches.length, 4);
  // All 4 students are assigned
  assert.equal(new Set(matches.map(m => m.student)).size, 4);
});

test('formatForSpreadsheet formats data properly for Apps Script export', () => {
  const matches = [
    { student: '김민준', role: { id: '1', name: '칠판 지우미', icon: '🧹', desc: '칠판 닦기' } },
    { student: '이서아', role: { id: '2', name: '우유 도우미', icon: '🥛', desc: '우유 챙기기' } }
  ];
  const formatted = formatForSpreadsheet(matches, '3학년 2반');
  assert.equal(formatted.className, '3학년 2반');
  assert.equal(formatted.rows.length, 2);
  assert.equal(formatted.rows[0].student, '김민준');
  assert.equal(formatted.rows[0].roleName, '칠판 지우미');
});

test('parseSpreadsheetData parses imported rows into students and roles', () => {
  const rawData = {
    students: ['홍길동', '김철수'],
    roles: [
      { name: '도서 도우미', icon: '📚', desc: '책 정리' }
    ]
  };
  const parsed = parseSpreadsheetData(rawData);
  assert.equal(parsed.students.length, 2);
  assert.equal(parsed.roles.length, 1);
  assert.equal(parsed.roles[0].name, '도서 도우미');
});
