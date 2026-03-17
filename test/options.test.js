'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { validateSameScopeImportsOptions } = require('../lib/options');
const { isIgnoredTargetScope } = require('../lib/tags');

test('accepts valid options', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: 'scope:',
    ignoredTargetScopes: ['scope:shared'],
  });

  assert.equal(result.valid, true);
});

test('rejects missing crossScopeAllowedTags', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: [],
    scopePrefix: 'scope:',
    ignoredTargetScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /crossScopeAllowedTags/);
});

test('rejects invalid crossScopeAllowedTags entry type', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell', 123],
    scopePrefix: 'scope:',
    ignoredTargetScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /crossScopeAllowedTags/);
});

test('rejects empty scopePrefix', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: '   ',
    ignoredTargetScopes: [],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /scopePrefix/);
});

test('rejects ignoredTargetScopes containing non-string values', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: 'scope:',
    ignoredTargetScopes: ['scope:shared', false],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /ignoredTargetScopes/);
});

test('ignores only target scopes listed in ignoredTargetScopes', () => {
  assert.equal(isIgnoredTargetScope('scope:shared', ['scope:shared']), true);
  assert.equal(isIgnoredTargetScope('scope:cart', ['scope:shared']), false);
});

test('rejects legacy ignoredScopes option', () => {
  const result = validateSameScopeImportsOptions({
    crossScopeAllowedTags: ['type:shell'],
    scopePrefix: 'scope:',
    ignoredScopes: ['scope:shared'],
  });

  assert.equal(result.valid, false);
  assert.match(result.reason, /ignoredTargetScopes/);
});
