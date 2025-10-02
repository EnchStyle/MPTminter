# MPT Minter - Development Guide

## Overview
MPT Minter is a web application for creating and managing Multi-Purpose Tokens (MPTs) on the XRP Ledger, implementing the XLS-0033 standard.

## Technical Stack
- **Frontend**: React 18 with Vite
- **UI Framework**: Material-UI v5
- **Blockchain**: XRPL.js for XRP Ledger integration
- **State Management**: React hooks (useState, useCallback, etc.)
- **Build Tool**: Vite with Node.js polyfills
- **Deployment**: Netlify

## Project Structure
```
/mnt/d/Coding/MPT Minter/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── steps/          # 8 wizard steps + dialogs
│   │   │   └── MPTokenManager.jsx
│   │   ├── services/           # Business logic
│   │   │   ├── xrplService.js
│   │   │   ├── sessionService.js
│   │   │   ├── validationService.js
│   │   │   └── metadataService.js
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/
│   │   │   └── theme.js        # MUI theme config
│   │   └── styles/
│   │       ├── global.css
│   │       └── form.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── old-version/                # Original HTML files
└── netlify.toml

## XLS-0033 MPT Implementation Details

### Transaction Types Implemented

1. **MPTokenIssuanceCreate** (Type: 54)
   - Creates new MPT issuance
   - Fields: Account, AssetScale, Flags, TransferFee, MaximumAmount, MPTokenMetadata
   - Current implementation in App.jsx lines 231-239

2. **MPTokenAuthorize** (Type: 57)
   - Authorizes token holder
   - Fields: Account, MPTokenIssuanceID, MPTokenHolder
   - Flag: tfMPTUnauthorize (0x0001)

3. **MPTokenIssuanceSet** (Type: 56)
   - **Status: Testing required on Devnet**
   - Purpose: Allows locking/unlocking tokens
   - Note: May not be available on mainnet yet

4. **MPTokenIssuanceDestroy** (Type: 55)
   - **Status: Testing required on Devnet**
   - Purpose: Destroys token issuance (only if no outstanding tokens)
   - Note: May not be available on mainnet yet
   - Requirements: Must be issuer, no outstanding tokens

### MPT Flags
```javascript
// Current implementation (App.jsx):
const flags = 
    (formData.canLock ? 1 : 0) |        // lsfMPTCanLock
    (formData.requireAuth ? 2 : 0) |     // lsfMPTRequireAuth
    (formData.canFreeze ? 4 : 0) |      // lsfMPTCanEscrow (mislabeled)
    (formData.canClawback ? 8 : 0);     // lsfMPTCanClawback
```

### Metadata Structure
- JSON object converted to hex
- Max 1024 bytes (2048 hex chars)
- Fields: currencyCode, name, description, iconUrl, assetClass, weblinks

### MPTIssuanceID Format
- 192-bit identifier
- Extracted from transaction metadata after creation

## Current Features

1. **Token Creation Wizard** (8 steps):
   - Wallet Connection
   - Token Info
   - Token Configuration
   - Metadata
   - Review
   - Token Creation
   - Token Issuance
   - Completion

2. **Session Management**:
   - Auto-saves progress
   - Resume capability
   - LocalStorage persistence

3. **Token Management**:
   - View created tokens
   - Manage issuances
   - Track balances

## Key Services

### XRPLService
- Manages XRPL connection
- Submits transactions
- Checks authorizations
- Fetches account objects

### MetadataService
- Builds JSON metadata
- Converts to hex format
- Validates size constraints
- Manages asset classes

### ValidationService
- Form field validation
- Real-time error checking
- Currency code validation
- Address validation

## Design System
- **Theme**: Light mode with purple gradient background
- **Colors**: 
  - Primary: #667eea
  - Secondary: #764ba2
  - Background gradient: #667eea to #764ba2
- **Cards**: White with subtle shadows
- **Spacing**: 8px base unit

## Build Configuration
- Vite with React plugin
- Node.js polyfills for browser compatibility
- Environment variables support
- Production build outputs to `dist/`

## Deployment
- Netlify configuration in `netlify.toml`
- Build command: `cd frontend && npm install && npm run build`
- Publish directory: `frontend/dist`

## Recent Updates (October 2025)
1. Restructured from monolithic HTML to modular React app
2. Fixed "process is not defined" error with polyfills
3. Fixed UI formatting issues
4. Restored original light color scheme
5. Improved layout with proper spacing and hierarchy

## Future Development Considerations

### Pending MPT Features
1. MPTokenIssuanceSet implementation (lock/unlock)
2. MPTokenIssuanceDestroy implementation
3. Trading capabilities (when lsfMPTCanTrade is set)
4. Escrow functionality (when lsfMPTCanEscrow is set)
5. Clawback functionality

### Technical Improvements
1. Implement proper MPT amount calculations with scale
2. Add transfer fee calculations
3. Improve metadata editor with preview
4. Add batch operations support
5. Implement proper error handling for MPT-specific errors

### UI/UX Enhancements
1. Add dark mode toggle
2. Improve mobile responsiveness
3. Add transaction history view
4. Implement advanced filtering for token list
5. Add export/import functionality

## Important Notes
- MPTs use fixed-point representation (not floating-point)
- Scale field determines decimal places: 1 unit = 10^scale MPT units
- Transfer fees are in basis points (0-50000 = 0-50%)
- Maximum metadata size is 1024 bytes
- MPTIssuanceID is derived from transaction sequence + issuer account

## Security Considerations
- Never store private keys
- All transactions signed client-side
- Validate all user inputs
- Check authorization before operations
- Implement rate limiting for API calls

## Testing Approach
- Test on XRPL Testnet first
- Verify metadata encoding/decoding
- Test all flag combinations
- Validate transfer fee calculations
- Test session recovery