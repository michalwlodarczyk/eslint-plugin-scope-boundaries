'use strict';

function getScopeTag(projectNode, scopePrefix) {
  const tags = projectNode?.data?.tags ?? [];
  return tags.find((tag) => tag.startsWith(scopePrefix));
}

function isCrossScopeAllowedProject(projectNode, crossScopeAllowedTags) {
  const tags = projectNode?.data?.tags ?? [];
  return crossScopeAllowedTags.some((allowedTag) => tags.includes(allowedTag));
}

module.exports = {
  getScopeTag,
  isCrossScopeAllowedProject,
};
