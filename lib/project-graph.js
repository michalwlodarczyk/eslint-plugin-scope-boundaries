'use strict';

const { normalizePath, workspaceRoot } = require('@nx/devkit');
const {
  readProjectGraph,
} = require('@nx/eslint-plugin/src/utils/project-graph-utils');
const {
  getSourceFilePath,
  findProject,
  findProjectUsingImport,
  getTargetProjectBasedOnRelativeImport,
  isAbsoluteImportIntoAnotherProject,
} = require('@nx/eslint-plugin/src/utils/runtime-lint-utils');

function createProjectGraphContext(ruleName, context) {
  const projectPath = normalizePath(global.projectPath || workspaceRoot);
  const fileName = normalizePath(context.filename ?? context.getFilename());

  const { projectGraph, projectRootMappings, targetProjectLocator } =
    readProjectGraph(ruleName);

  if (!projectGraph) {
    return null;
  }

  const sourceFilePath = getSourceFilePath(fileName, projectPath);
  const sourceProject = findProject(projectGraph, projectRootMappings, sourceFilePath);

  return {
    projectGraph,
    projectRootMappings,
    targetProjectLocator,
    projectPath,
    sourceFilePath,
    sourceProject,
  };
}

function resolveTargetProject(graphContext, importExpr) {
  const isAbsoluteImport = isAbsoluteImportIntoAnotherProject(
    importExpr,
    global.workspaceLayout
  );

  let targetProject;
  if (isAbsoluteImport) {
    targetProject = findProject(
      graphContext.projectGraph,
      graphContext.projectRootMappings,
      importExpr
    );
  } else {
    targetProject = getTargetProjectBasedOnRelativeImport(
      importExpr,
      graphContext.projectPath,
      graphContext.projectGraph,
      graphContext.projectRootMappings,
      graphContext.sourceFilePath
    );
  }

  return (
    targetProject ||
    findProjectUsingImport(
      graphContext.projectGraph,
      graphContext.targetProjectLocator,
      graphContext.sourceFilePath,
      importExpr
    )
  );
}

module.exports = {
  createProjectGraphContext,
  resolveTargetProject,
};
