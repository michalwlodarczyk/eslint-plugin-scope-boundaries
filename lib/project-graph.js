'use strict';

const path = require('node:path');
const {
  normalizePath,
  workspaceRoot,
  readCachedProjectGraph,
} = require('@nx/devkit');
const {
  readNxJsonFromDisk,
  createProjectRootMappings,
  findProjectForPath,
  TargetProjectLocator,
} = require('@nx/devkit/internal');

// Mirrors `isTerminalRun` from @nx/eslint-plugin: one-shot processes can reuse
// the graph, long-lived ones (IDE ESLint servers) must re-read it so that
// newly added projects are picked up without a restart.
const TERMINAL_ENTRY_REGEXES = [
  /nx[/\\]dist[/\\]bin[/\\]run-executor\.js$/,
  /node_modules.*[/\\]eslint(?:\.js)?$/,
  /node_modules.*[/\\]eslint[/\\]lib[/\\]eslint[/\\]worker\.js$/,
  /node_modules[/\\]\.bin[/\\]jest$/,
  /[/\\]bin[/\\]jest\.js$/,
];
const OXLINT_REGEX = /node_modules.*[/\\]oxlint(?:\.js)?$/;
const BUN_REGEX = /(?:^|[/\\])bun(?:\.exe)?$/;

function isTerminalRun(argv = process.argv) {
  if (argv.length < 2) {
    return false;
  }
  const entry = argv[1];
  return (
    TERMINAL_ENTRY_REGEXES.some((regex) => regex.test(entry)) ||
    (OXLINT_REGEX.test(entry) && !argv.includes('--lsp')) ||
    (BUN_REGEX.test(argv[0]) && entry === 'lint')
  );
}

let cache = null;

function readProjectGraph() {
  if (cache && isTerminalRun()) {
    return cache;
  }
  try {
    const projectGraph = readCachedProjectGraph();
    cache = {
      projectGraph,
      projectRootMappings: createProjectRootMappings(projectGraph.nodes),
      targetProjectLocator: new TargetProjectLocator(
        projectGraph.nodes,
        projectGraph.externalNodes
      ),
      workspaceLayout: readNxJsonFromDisk().workspaceLayout,
    };
  } catch {
    // No cached project graph available: the rule is skipped.
    cache = { projectGraph: null };
  }
  return cache;
}

function getSourceFilePath(fileName, projectPath) {
  return normalizePath(fileName).slice(normalizePath(projectPath).length + 1);
}

function findProject(projectGraph, projectRootMappings, filePath) {
  return projectGraph.nodes[findProjectForPath(filePath, projectRootMappings)];
}

function isAbsoluteImportIntoAnotherProject(importExpr, workspaceLayout) {
  const { libsDir = 'libs', appsDir = 'apps' } = workspaceLayout ?? {};
  return [libsDir, appsDir].some(
    (dir) => importExpr.startsWith(`${dir}/`) || importExpr.startsWith(`/${dir}/`)
  );
}

function getTargetProjectBasedOnRelativeImport(importExpr, graphContext) {
  if (!importExpr.startsWith('.')) {
    return undefined;
  }
  const sourceDir = path.join(
    graphContext.projectPath,
    path.dirname(graphContext.sourceFilePath)
  );
  const targetFile = normalizePath(path.resolve(sourceDir, importExpr)).substring(
    graphContext.projectPath.length + 1
  );
  return findProject(
    graphContext.projectGraph,
    graphContext.projectRootMappings,
    targetFile
  );
}

function createProjectGraphContext(_ruleName, context) {
  const { projectGraph, projectRootMappings, targetProjectLocator, workspaceLayout } =
    readProjectGraph();

  if (!projectGraph) {
    return null;
  }

  const projectPath = normalizePath(workspaceRoot);
  const sourceFilePath = getSourceFilePath(
    context.filename ?? context.getFilename(),
    projectPath
  );

  return {
    projectGraph,
    projectRootMappings,
    targetProjectLocator,
    workspaceLayout,
    projectPath,
    sourceFilePath,
    sourceProject: findProject(projectGraph, projectRootMappings, sourceFilePath),
  };
}

function resolveTargetProject(graphContext, importExpr) {
  const targetProject = isAbsoluteImportIntoAnotherProject(
    importExpr,
    graphContext.workspaceLayout
  )
    ? findProject(
        graphContext.projectGraph,
        graphContext.projectRootMappings,
        importExpr
      )
    : getTargetProjectBasedOnRelativeImport(importExpr, graphContext);

  if (targetProject) {
    return targetProject;
  }

  const name = graphContext.targetProjectLocator.findProjectFromImport(
    importExpr,
    graphContext.sourceFilePath
  );
  return (
    graphContext.projectGraph.nodes[name] ||
    graphContext.projectGraph.externalNodes?.[name]
  );
}

module.exports = {
  createProjectGraphContext,
  resolveTargetProject,
  // Exported for tests.
  isTerminalRun,
  isAbsoluteImportIntoAnotherProject,
  getTargetProjectBasedOnRelativeImport,
};
