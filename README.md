# eslint-plugin-scope-boundaries

ESLint plugin for Nx monorepos that enforces scope-based import boundaries, with configurable cross-scope exceptions and ignored scopes.

## Installation

```bash
npm install --save-dev eslint-plugin-scope-boundaries
```

Peer dependencies expected in consumer project:
- `eslint`
- `@typescript-eslint/utils`
- `@nx/devkit`
- `@nx/eslint-plugin`
- `nx`

## Usage

```json
{
  "overrides": [
    {
      "files": ["*.ts", "*.js"],
      "plugins": ["scope-boundaries"],
      "rules": {
        "scope-boundaries/same-scope-imports": [
          "warn",
          {
            "crossScopeAllowedTags": ["type:shell", "type:composition"],
            "scopePrefix": "scope:",
            "checkExports": true,
            "reportMissingScopeTags": true,
            "ignoredScopes": ["scope:shared", "scope:foundation"]
          }
        ]
      }
    }
  ]
}
```

## Rule: `same-scope-imports`

Behavior:
- A library can import another library only when both share the same scope tag prefix (for example `scope:billing` -> `scope:billing`).
- Specific source tags can be allowed to import across scopes via `crossScopeAllowedTags`.
- Optional scopes can be ignored via `ignoredScopes`.
- Libraries without a scope tag are reported when `reportMissingScopeTags` is enabled.

Options:
- `crossScopeAllowedTags` (required): non-empty array of source tags that can import across scopes.
- `scopePrefix` (required): prefix used to detect scope tags, e.g. `scope:`.
- `checkExports` (optional, default `true`): include `export ... from` and `export * from` in checks.
- `reportMissingScopeTags` (optional, default `true`): report missing scope tags on source/target projects.
- `ignoredScopes` (optional, default `[]`): skip cross-scope validation when source or target scope is listed.

Minimal examples:
- `crossScopeAllowedTags`: `["type:shell"]`
- `scopePrefix`: `"scope:"`
- `checkExports`: `true`
- `reportMissingScopeTags`: `false`
- `ignoredScopes`: `["scope:shared"]`

## Development

Run tests:

```bash
npm test
```

## License

MIT
