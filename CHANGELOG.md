# Changelog

All notable changes to this project will be documented in this file.

## 0.3.0

### Changed

- Project graph access now goes through the public `@nx/devkit` and `@nx/devkit/internal` entry points instead of deep imports into `@nx/eslint-plugin`, which Nx 24 blocks via its `exports` map.
- The rule no longer deep-imports from `nx/src/...`; the plugin has no deep imports into Nx packages.
- Removed the `@nx/eslint-plugin` peer dependency.

### Breaking Changes

- Requires Nx 24 (`nx` and `@nx/devkit` `^24.0.0`). Stay on 0.2.0 for Nx 22.

## 0.2.0

### Changed

- Changed `ignoredScopes` semantics to apply only to imported target scopes.
- Renamed rule option from `ignoredScopes` to `ignoredTargetScopes`.

### Breaking Changes

- `ignoredScopes` is no longer supported.
- Update ESLint config to use `ignoredTargetScopes`.

### Example Migration

Before:

```json
{
  "ignoredScopes": ["scope:shared"]
}
```

After:

```json
{
  "ignoredTargetScopes": ["scope:shared"]
}
```
