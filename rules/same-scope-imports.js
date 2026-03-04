'use strict';

const { ESLintUtils, AST_NODE_TYPES } = require('@typescript-eslint/utils');
const { isProjectGraphProjectNode } = require('nx/src/config/project-graph');
const {
  createProjectGraphContext,
  resolveTargetProject,
} = require('../lib/project-graph');
const { validateSameScopeImportsOptions } = require('../lib/options');
const { getScopeTag, isCrossScopeAllowedProject } = require('../lib/tags');

const RULE_NAME = 'same-scope-imports';

module.exports = ESLintUtils.RuleCreator(() =>
  'https://github.com/michalwlodarczyk/eslint-plugin-scope-boundaries#readme'
)({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow cross-scope Nx project imports unless source project is tagged as cross-scope allowed',
    },
    schema: [
      {
        type: 'object',
        properties: {
          crossScopeAllowedTags: {
            type: 'array',
            items: { type: 'string' },
          },
          scopePrefix: {
            type: 'string',
          },
          checkExports: {
            type: 'boolean',
          },
          reportMissingScopeTags: {
            type: 'boolean',
          },
          ignoredScopes: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      crossScopeForbidden:
        'Cross-scope import is forbidden. "{{sourceProject}}" ({{sourceScope}}) cannot import "{{targetProject}}" ({{targetScope}}).',
      missingSourceScope:
        'Project "{{sourceProject}}" is missing a scope tag (expected prefix "{{scopePrefix}}").',
      missingTargetScope:
        'Project "{{targetProject}}" is missing a scope tag (expected prefix "{{scopePrefix}}").',
      invalidRuleConfig:
        'Invalid rule configuration for same-scope-imports: {{reason}}',
    },
  },
  defaultOptions: [
    {
      crossScopeAllowedTags: [],
      scopePrefix: 'scope:',
      checkExports: true,
      reportMissingScopeTags: true,
      ignoredScopes: [],
    },
  ],
  create(context, [options]) {
    const validation = validateSameScopeImportsOptions(options);
    if (!validation.valid) {
      return {
        Program(node) {
          context.report({
            node,
            messageId: 'invalidRuleConfig',
            data: { reason: validation.reason },
          });
        },
      };
    }

    const graphContext = createProjectGraphContext(RULE_NAME, context);
    if (!graphContext) {
      return {};
    }

    const sourceProject = graphContext.sourceProject;
    if (!sourceProject || !isProjectGraphProjectNode(sourceProject)) {
      return {};
    }

    if (sourceProject.data.projectType !== 'library') {
      return {};
    }

    if (isCrossScopeAllowedProject(sourceProject, options.crossScopeAllowedTags)) {
      return {};
    }

    const sourceScope = getScopeTag(sourceProject, options.scopePrefix);

    function checkNode(node) {
      if (!node.source || node.source.type !== AST_NODE_TYPES.Literal) {
        return;
      }

      const importExpr = node.source.value;
      if (typeof importExpr !== 'string') {
        return;
      }

      if (!sourceScope) {
        if (options.reportMissingScopeTags !== false) {
          context.report({
            node,
            messageId: 'missingSourceScope',
            data: {
              sourceProject: sourceProject.name,
              scopePrefix: options.scopePrefix,
            },
          });
        }
        return;
      }

      const targetProject = resolveTargetProject(graphContext, importExpr);
      if (!targetProject || !isProjectGraphProjectNode(targetProject)) {
        return;
      }

      if (sourceProject.name === targetProject.name) {
        return;
      }

      const targetScope = getScopeTag(targetProject, options.scopePrefix);
      if (!targetScope) {
        if (options.reportMissingScopeTags !== false) {
          context.report({
            node,
            messageId: 'missingTargetScope',
            data: {
              targetProject: targetProject.name,
              scopePrefix: options.scopePrefix,
            },
          });
        }
        return;
      }

      if (
        options.ignoredScopes.includes(sourceScope) ||
        options.ignoredScopes.includes(targetScope)
      ) {
        return;
      }

      if (sourceScope !== targetScope) {
        context.report({
          node,
          messageId: 'crossScopeForbidden',
          data: {
            sourceProject: sourceProject.name,
            sourceScope,
            targetProject: targetProject.name,
            targetScope,
          },
        });
      }
    }

    const listeners = {
      ImportDeclaration: checkNode,
    };

    if (options.checkExports) {
      listeners.ExportNamedDeclaration = checkNode;
      listeners.ExportAllDeclaration = checkNode;
    }

    return listeners;
  },
});
