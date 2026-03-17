# Changelog

All notable changes to this project will be documented in this file.

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
