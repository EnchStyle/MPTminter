# MPT Minter Frontend

Modern React application for creating and managing Multi-Purpose Tokens (MPT) on the XRP Ledger.

## Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   │   ├── steps/   # Token creation wizard steps
│   │   └── dialogs/ # Dialog components
│   ├── hooks/       # Custom React hooks
│   ├── services/    # Business logic and API services
│   ├── styles/      # CSS and theme files
│   └── utils/       # Utility functions and constants
├── package.json     # Dependencies and scripts
└── vite.config.js   # Vite configuration
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```
VITE_XRPL_MAINNET_URL=wss://xrplcluster.com
VITE_XRPL_EXPLORER_URL=https://livenet.xrpl.org
VITE_SESSION_MAX_AGE=3600000
```

## Technology Stack

- **React 18** - UI framework
- **Material-UI v5** - Component library
- **Vite** - Build tool and dev server
- **XRPL.js** - XRP Ledger integration
- **React Router** - Client-side routing

## Features

- Multi-step token creation wizard
- Real-time XRPL connection status
- Session persistence
- Token management dashboard
- Responsive design
- Form validation
- Error handling