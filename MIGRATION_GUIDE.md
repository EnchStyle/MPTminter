# Migration Guide: From Monolithic HTML to Modern React App

This document outlines the restructuring of the MPT Minter project from a single HTML file to a modern, modular React application.

## What Changed

### Old Structure
```
MPT-Minter/
├── index.html                    # Everything in one 3000+ line file
├── mpt-creator-clean.html       # Duplicate version
├── mpt-creator-production.html  # Another duplicate
├── netlify.toml                 # Static site config
└── README.md
```

### New Structure
```
MPT-Minter/
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # Modular React components
│   │   ├── services/          # Business logic services
│   │   ├── hooks/             # Custom React hooks
│   │   └── utils/             # Utilities and constants
│   ├── package.json           # Dependencies
│   └── vite.config.js         # Build configuration
├── netlify.toml               # Updated for build process
└── MIGRATION_GUIDE.md         # This file
```

## Key Improvements

1. **Modularization**
   - Services extracted into separate files
   - Components split into individual files
   - Hooks isolated for reusability
   - Clear separation of concerns

2. **Build Process**
   - Vite for fast development and optimized builds
   - Proper module bundling
   - Tree shaking for smaller bundle size
   - Environment variable support

3. **Development Experience**
   - Hot Module Replacement (HMR)
   - TypeScript ready
   - ESLint configured
   - Better debugging with source maps

4. **Performance**
   - Code splitting capabilities
   - Lazy loading support
   - Optimized production builds
   - Proper caching headers

## Migration Steps Completed

1. ✅ Created modern React project structure with Vite
2. ✅ Extracted all service classes (XRPL, Session, Validation, Metadata)
3. ✅ Modularized React hooks
4. ✅ Split components into individual files
5. ✅ Set up environment variables
6. ✅ Updated deployment configuration
7. ✅ Added proper build process

## How to Deploy

### Local Development
```bash
cd frontend
npm install
npm run dev
```

### Production Build
```bash
cd frontend
npm install
npm run build
```

### Netlify Deployment
The project will automatically build and deploy on Netlify with the updated configuration.

## Breaking Changes

1. **File Paths**: The app now builds to `frontend/dist` instead of root
2. **Dependencies**: Must run `npm install` in frontend directory
3. **Environment Variables**: Now use `.env` files instead of hardcoded values

## Next Steps

1. Consider adding TypeScript for type safety
2. Implement unit tests for services and components
3. Add E2E tests for critical user flows
4. Set up CI/CD pipeline
5. Add error tracking (e.g., Sentry)
6. Implement analytics

## Rollback Instructions

If you need to rollback to the old structure:
1. The original HTML files are preserved
2. Update netlify.toml to remove build commands
3. Set publish directory back to "."