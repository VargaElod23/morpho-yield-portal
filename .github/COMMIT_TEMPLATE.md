# Commit Message Template

## Format

```bash
<type>: <description>

[optional body]

[optional footer]
```

## Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, build changes

## Examples

```bash
feat: add push notification system

- Implement daily yield notifications
- Add VAPID key authentication  
- Support multi-chain tracking

Closes #123
```

```bash
fix: resolve calculation discrepancy

Fixed yield calculations to use transaction-based approach
for consistency across all components.
```

```bash
chore: release v1.1.0
```

## Changelog Integration

After committing, don't forget to update the changelog:

```bash
npm run changelog:add "Your change description" "Added|Fixed|Changed"
```
