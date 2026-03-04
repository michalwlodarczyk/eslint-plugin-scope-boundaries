'use strict';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isNonEmptyStringArray(value) {
  return isStringArray(value) && value.length > 0;
}

function validateSameScopeImportsOptions(options) {
  if (!isNonEmptyStringArray(options.crossScopeAllowedTags)) {
    return {
      valid: false,
      reason:
        '"crossScopeAllowedTags" must be a non-empty array of tag strings defined in ESLint config.',
    };
  }

  if (!isNonEmptyString(options.scopePrefix)) {
    return {
      valid: false,
      reason: '"scopePrefix" must be a non-empty string defined in ESLint config.',
    };
  }

  if (!isStringArray(options.ignoredScopes)) {
    return {
      valid: false,
      reason: '"ignoredScopes" must be an array of scope tag strings.',
    };
  }

  return { valid: true };
}

module.exports = {
  validateSameScopeImportsOptions,
};
