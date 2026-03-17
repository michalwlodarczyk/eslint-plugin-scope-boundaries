'use strict';

function getScopeTag(projectNode, scopePrefix) {
  const tags = projectNode?.data?.tags ?? [];
  return tags.find((tag) => tag.startsWith(scopePrefix));
}

function isCrossScopeAllowedProject(projectNode, crossScopeAllowedTags) {
  const tags = projectNode?.data?.tags ?? [];
  return crossScopeAllowedTags.some((allowedTag) => tags.includes(allowedTag));
}

function isIgnoredTargetScope(targetScope, ignoredScopes) {
  return ignoredScopes.includes(targetScope);
}

module.exports = {
  getScopeTag,
  isCrossScopeAllowedProject,
  isIgnoredTargetScope,
};
