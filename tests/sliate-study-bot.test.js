import test from 'node:test';
import assert from 'node:assert/strict';

test('course codes and course names are documented', async () => {
  const { courseCodes, courseName, normalizeNumber } = await import('../lib/sliateStudyBot.js');
  assert.deepEqual(courseCodes(), ['IT','THM','M','A','BA']);
  assert.equal(courseName('IT'), 'HNDIT');
  assert.equal(courseName('THM'), 'HNDTHM');
  assert.equal(courseName('M'), 'HNDM');
  assert.equal(courseName('A'), 'HNDA');
  assert.equal(courseName('BA'), 'HNDBA');
  assert.equal(normalizeNumber('+94 77-608-3337@s.whatsapp.net'), '94776083337');
});
