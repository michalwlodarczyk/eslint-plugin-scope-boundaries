'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSameScopeImportsOptions } = require('../lib/options');

test('accepts valid options', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: 'scope:',
    ignoredScopes: ['scope:shared'],
  });

  assert.equal(result.valid, true);
});

test('rejects missing crossScopeAllowedTags', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: [],
    scopePrefix: 'scope:',
    ignoredScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /crossScopeAllowedTags/);
});

test('rejects invalid crossScopeAllowedTags entry type', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell', 123],
    scopePrefix: 'scope:',
    ignoredScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /crossScopeAllowedTags/);
});

test('rejects empty scopePrefix', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: '   ',
    ignoredScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /scopePrefix/);
});

test('rejects ignoredScopes containing non-string values', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: 'scope:',
    ignoredScopes: ['scope:shared', false],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /ignoredScopes/);
});
