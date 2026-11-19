'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createProjectRootMappings } = require('@nx/devkit/internal');
const {
  resolveTargetProject,
  isTerminalRun,
  isAbsoluteImportIntoAnotherProject,
  getTargetProjectBasedOnRelativeImport,
} = require('../lib/project-graph');

function libNode(name, root, tags = []) {
  return { name, type: 'lib', data: { root, tags, projectType: 'library' } };
}

function createGraphContext(sourceFilePath, aliases = {}) {
  const nodes = {
    cart: libNode('cart', 'libs/cart', ['scope:cart']),
    'cart-ui': libNode('cart-ui', 'libs/cart/ui', ['scope:cart']),
    shared: libNode('shared', 'libs/shared', ['scope:shared']),
  };
  const externalNodes = {
    'npm:rxjs': { name: 'npm:rxjs', type: 'npm', data: { packageName: 'rxjs' } },
  };
  return {
    projectGraph: { nodes, externalNodes, dependencies: {} },
    projectRootMappings: createProjectRootMappings(nodes),
    targetProjectLocator: {
      findProjectFromImport: (importExpr) => aliases[importExpr],
    },
    workspaceLayout: undefined,
    projectPath: '/workspace',
    sourceFilePath,
  };
}

test('@nx/devkit exposes the API the plugin relies on', () => {
  const devkit = require('@nx/devkit');
  const internal = require('@nx/devkit/internal');

  assert.equal(typeof devkit.workspaceRoot, 'string');
  for (const name of ['normalizePath', 'readCachedProjectGraph']) {
    assert.equal(typeof devkit[name], 'function', name);
  }
  for (const name of [
    'readNxJsonFromDisk',
    'createProjectRootMappings',
    'findProjectForPath',
    'TargetProjectLocator',
    'isProjectGraphProjectNode',
  ]) {
    assert.equal(typeof internal[name], 'function', name);
  }
});

test('isAbsoluteImportIntoAnotherProject detects libs/ and apps/ paths', () => {
  assert.equal(isAbsoluteImportIntoAnotherProject('libs/cart/src/index'), true);
  assert.equal(isAbsoluteImportIntoAnotherProject('/libs/cart/src/index'), true);
  assert.equal(isAbsoluteImportIntoAnotherProject('apps/shop/src/main'), true);
  assert.equal(isAbsoluteImportIntoAnotherProject('@ems/cart'), false);
  assert.equal(isAbsoluteImportIntoAnotherProject('./libs/cart'), false);
  assert.equal(isAbsoluteImportIntoAnotherProject('libsodium'), false);
});

test('isAbsoluteImportIntoAnotherProject honours workspaceLayout', () => {
  const layout = { libsDir: 'packages', appsDir: 'services' };

  assert.equal(isAbsoluteImportIntoAnotherProject('packages/cart', layout), true);
  assert.equal(isAbsoluteImportIntoAnotherProject('services/api', layout), true);
  assert.equal(isAbsoluteImportIntoAnotherProject('libs/cart', layout), false);
  assert.equal(
    isAbsoluteImportIntoAnotherProject('libs/cart', { libsDir: 'packages' }),
    false
  );
  assert.equal(
    isAbsoluteImportIntoAnotherProject('apps/shop', { libsDir: 'packages' }),
    true
  );
});

test('getTargetProjectBasedOnRelativeImport resolves relative imports', () => {
  const ctx = createGraphContext('libs/cart/src/lib/cart.service.ts');

  assert.equal(
    getTargetProjectBasedOnRelativeImport('./cart.model', ctx).name,
    'cart'
  );
  assert.equal(
    getTargetProjectBasedOnRelativeImport('../../../shared/src/index', ctx).name,
    'shared'
  );
  assert.equal(
    getTargetProjectBasedOnRelativeImport('../../ui/src/button', ctx).name,
    'cart-ui'
  );
  assert.equal(
    getTargetProjectBasedOnRelativeImport('../../../../tools/script', ctx),
    undefined
  );
});

test('getTargetProjectBasedOnRelativeImport ignores non-relative imports', () => {
  const ctx = createGraphContext('libs/cart/src/lib/cart.service.ts');

  assert.equal(getTargetProjectBasedOnRelativeImport('@ems/shared', ctx), undefined);
  assert.equal(
    getTargetProjectBasedOnRelativeImport('libs/shared/src/index', ctx),
    undefined
  );
});

test('resolveTargetProject resolves libs/ paths without the locator', () => {
  const ctx = createGraphContext('libs/cart/src/lib/cart.service.ts');
  ctx.targetProjectLocator.findProjectFromImport = () => {
    throw new Error('locator should not be used');
  };

  assert.equal(resolveTargetProject(ctx, 'libs/shared/src/index').name, 'shared');
  assert.equal(resolveTargetProject(ctx, '../../ui/src/button').name, 'cart-ui');
});

test('resolveTargetProject resolves path aliases through the locator', () => {
  const ctx = createGraphContext('libs/cart/src/lib/cart.service.ts', {
    '@ems/shared': 'shared',
    '@ems/cart/ui': 'cart-ui',
    rxjs: 'npm:rxjs',
  });

  assert.equal(resolveTargetProject(ctx, '@ems/shared').name, 'shared');
  assert.equal(resolveTargetProject(ctx, '@ems/cart/ui').name, 'cart-ui');
  assert.equal(resolveTargetProject(ctx, 'rxjs').name, 'npm:rxjs');
  assert.equal(resolveTargetProject(ctx, '@ems/unknown'), undefined);
});

test('resolveTargetProject passes import and source file to the locator', () => {
  const ctx = createGraphContext('libs/cart/src/lib/cart.service.ts');
  const calls = [];
  ctx.targetProjectLocator.findProjectFromImport = (...args) => {
    calls.push(args);
    return 'shared';
  };

  resolveTargetProject(ctx, '@ems/shared');

  assert.deepEqual(calls, [['@ems/shared', 'libs/cart/src/lib/cart.service.ts']]);
});

test('isTerminalRun recognises one-shot lint processes', () => {
  const node = '/usr/bin/node';

  assert.equal(isTerminalRun([node, '/ws/node_modules/.bin/eslint']), true);
  assert.equal(isTerminalRun([node, '/ws/node_modules/eslint/bin/eslint.js']), true);
  assert.equal(
    isTerminalRun([node, '/ws/node_modules/eslint/lib/eslint/worker.js']),
    true
  );
  assert.equal(
    isTerminalRun([node, '/ws/node_modules/nx/dist/bin/run-executor.js']),
    true
  );
  assert.equal(isTerminalRun([node, '/ws/node_modules/.bin/oxlint']), true);
});

test('isTerminalRun treats language servers as long-lived', () => {
  const node = '/usr/bin/node';

  assert.equal(isTerminalRun([node]), false);
  assert.equal(
    isTerminalRun([node, '/ide/plugins/eslint/languageserver/main.js']),
    false
  );
  assert.equal(isTerminalRun([node, '/ws/node_modules/.bin/oxlint', '--lsp']), false);
});
