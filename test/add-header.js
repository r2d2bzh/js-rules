import test from 'node:test';
import assert from 'node:assert/strict';
import { addHashedHeader, addHeader } from '../index.js';

test('a single line header is prefixed', () => {
  assert.equal(addHashedHeader('warning')('content\n'), '# warning\ncontent\n');
});

test('each line of a multi-line header is prefixed', () => {
  assert.equal(addHashedHeader(['first', 'second'])('content\n'), '# first\n# second\ncontent\n');
});

test('any iterable can be given as a multi-line header', () => {
  assert.equal(addHashedHeader(new Set(['first', 'second']))(), '# first\n# second\n');
});

test('a string header is not split into characters', () => {
  assert.equal(addHeader('// ')('header')(), '// header\n');
});

test('trailing spaces of an empty line are trimmed', () => {
  assert.equal(addHashedHeader(['first', '', 'third'])(), '# first\n#\n# third\n');
});
