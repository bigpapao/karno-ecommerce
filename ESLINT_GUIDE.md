# ESLint Global Fix Guide

## Overview
This project has been configured with relaxed ESLint rules to minimize common errors while maintaining code quality.

## Project Structure
- **Root**: General ESLint config for the entire project
- **Frontend** (`karno/frontend/`): React-specific ESLint config
- **Backend** (`karno/backend/`): Node.js-specific ESLint config

## Quick Fix Commands

### 1. Fix All Projects at Once
```bash
# Check all issues
npm run lint

# Auto-fix all fixable issues
npm run lint:fix
```

### 2. Fix Frontend Only
```bash
# Check frontend issues
npm run lint:frontend

# Auto-fix frontend issues
npm run lint:frontend:fix
```

### 3. Fix Backend Only
```bash
# Check backend issues
npm run lint:backend

# Auto-fix backend issues
npm run lint:backend:fix
```

## Common Issues and Solutions

### 1. Node.js Not Found
If you get "node is not recognized" error:
- Install Node.js from https://nodejs.org/
- Or use the full path: `C:\Program Files\nodejs\node.exe`
- Or use VS Code's integrated terminal

### 2. Too Many Errors
The configs have been relaxed to show warnings instead of errors for:
- `no-unused-vars`: Variables declared but not used
- `no-console`: Console.log statements
- `no-undef`: Undefined variables
- Import/export issues

### 3. React-specific Issues
Frontend config handles:
- JSX syntax
- React hooks
- Import statements
- PropTypes (disabled)

### 4. Backend-specific Issues
Backend config handles:
- Node.js globals
- MongoDB `_id` usage
- ES6 modules
- Console statements (allowed)

## Manual Fixes for Common Issues

### Unused Variables
```javascript
// Before (warning)
const unusedVar = 'test';

// After (fixed)
const _unusedVar = 'test'; // Prefix with _ to indicate intentionally unused
// Or remove the variable entirely
```

### Console Statements
```javascript
// In development - warnings only
console.log('Debug info');

// For production, use proper logging
import logger from './utils/logger.js';
logger.info('Production info');
```

### Undefined Variables
```javascript
// Before (warning)
if (someUndefinedVar) { }

// After (fixed)
if (typeof someUndefinedVar !== 'undefined' && someUndefinedVar) { }
// Or define the variable properly
```

## Ignored Directories
The following are automatically ignored:
- `node_modules/`
- `build/`, `dist/`, `coverage/`
- `public/`
- `browser-tools-mcp/`
- `chrome-extension/`
- Config files (`*.config.js`)

## VS Code Integration
Add to your VS Code settings.json:
```json
{
  "eslint.workingDirectories": [
    ".",
    "karno/frontend",
    "karno/backend"
  ],
  "eslint.format.enable": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Gradual Improvement Strategy
1. Start with auto-fixable issues: `npm run lint:fix`
2. Address warnings one project at a time
3. Gradually tighten rules as code quality improves
4. Focus on critical issues first (undefined variables, unreachable code)

## Need Help?
- Check the specific error message
- Look up the rule name on https://eslint.org/docs/rules/
- Many issues can be auto-fixed with the `:fix` commands
- Consider disabling specific rules temporarily if they're blocking development 