# Project Rules

## Version Increment Rule
**Every time you make changes to the extension code, increment the version number in `manifest.json`.**

- Use semantic versioning: `major.minor.patch`
- For small changes/fixes: increment patch (e.g., 1.0.0 → 1.0.1)
- For new features: increment minor (e.g., 1.0.1 → 1.1.0)
- For breaking changes: increment major (e.g., 1.1.0 → 2.0.0)

This allows verifying that Chrome refreshed the extension by checking the version in `chrome://extensions`.
