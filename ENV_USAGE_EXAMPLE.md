# Vite Environment Variables Usage Guide

## Key Rules for Vite Environment Variables

### 1. **VITE_ Prefix Requirement**
- Only variables prefixed with `VITE_` are exposed to the client
- Variables without `VITE_` prefix are NOT accessible in frontend code

### 2. **Using Variables in React Components**

#### ❌ INCORRECT - Will not work
```typescript
// No VITE_ prefix - not exposed to client
const apiUrl = import.meta.env.API_BASE_URL; // undefined
const appName = import.meta.env.APP_NAME; // undefined
```

#### ✅ CORRECT - Will work
```typescript
// With VITE_ prefix - exposed to client
const apiUrl = import.meta.env.VITE_API_BASE_URL;
const appName = import.meta.env.VITE_APP_NAME;
```

## How to Use in Your Project

### Example 1: Using in API Configuration

The API file has already been updated (`src/lib/api.ts`):
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

### Example 2: Using in React Components

```typescript
// src/components/AppHeader.tsx
import React from 'react';

export function AppHeader() {
  const appName = import.meta.env.VITE_APP_NAME || 'My App';

  return (
    <header>
      <h1>{appName}</h1>
      <p>API: {import.meta.env.VITE_API_BASE_URL}</p>
    </header>
  );
}
```

### Example 3: Conditional Logic Based on Environment

```typescript
// src/utils/logger.ts
export function log(message: string) {
  // Vite automatically sets NODE_ENV
  if (import.meta.env.DEV) {
    console.log('[DEV]', message);
  } else if (import.meta.env.PROD) {
    // Only log to production service in production
    // sendToLogService(message);
  }
}
```

## Built-in Vite Environment Variables

Vite provides these built-in variables:

- `import.meta.env.MODE`: {string} The mode the app is running in (development, production)
- `import.meta.env.BASE_URL`: {string} The base URL the app is being served from
- `import.meta.env.PROD`: {boolean} Whether the app is running in production
- `import.meta.env.DEV`: {boolean} Whether the app is running in development
- `import.meta.env.SSR`: {boolean} Whether the app is running in server-side rendering

## TypeScript Support (IntelliSense)

For better TypeScript support, create a type declaration file:

```typescript
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
  // Add more variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Security Best Practices

### ✅ DO:
- Use `VITE_` prefix for frontend-exposed variables
- Store sensitive data in backend environment variables (without VITE_)
- Use different .env files for different environments (.env.development, .env.production)
- Add `.env` to `.gitignore` for sensitive projects

### ❌ DON'T:
- Expose API keys, secrets, or passwords with VITE_ prefix
- Commit sensitive credentials to version control
- Use backend-only variables (like DB_PASSWORD) in frontend code

## Multiple Environment Files

You can create different environment files:

- `.env` - Default environment variables
- `.env.local` - Local overrides (should be in .gitignore)
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables
- `.env.staging` - Staging-specific variables

Priority order: .env.local > .env.{mode} > .env

## Troubleshooting

### Variable is undefined
```bash
# Check if variable has VITE_ prefix
# Check if .env file is in project root
# Restart Vite dev server after changing .env
npm run dev
```

### Changes not reflecting
```bash
# Always restart Vite after modifying .env
# Environment variables are loaded once at startup
```

### TypeScript errors
```bash
# Ensure src/vite-env.d.ts has proper type declarations
# Ensure tsconfig includes the vite-env.d.ts file
```

## Your Updated Project Structure

✅ **Backend variables** (Django) - NOT prefixed, not exposed to frontend
- DEBUG, SECRET_KEY, DB_PASSWORD, EMAIL_HOST_PASSWORD

✅ **Frontend variables** (Vite/React) - Prefixed with VITE_
- VITE_API_BASE_URL, VITE_APP_NAME

✅ **API Configuration** (`src/lib/api.ts`)
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
```

Your environment variables are now properly configured! 🎉
