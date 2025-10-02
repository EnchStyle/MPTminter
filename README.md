# MPT Minter - XRPL Multi-Purpose Token Creator

[![XRPL](https://img.shields.io/badge/XRPL-Mainnet-green.svg)](https://xrpl.org/)
[![XLS-33](https://img.shields.io/badge/XLS--33-Compliant-blue.svg)](https://github.com/XRPLF/XRPL-Standards/discussions/113)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive web-based tool for creating and managing Multi-Purpose Tokens (MPTs) on the XRP Ledger mainnet. Built with React and the XRPL JavaScript library, this tool provides an intuitive interface for token creation, issuance, and management.

![MPT Minter Screenshot](screenshot.png)

## 🚀 Features

### Token Creation
- **Step-by-step wizard** for creating MPT tokens
- **Comprehensive metadata support** including name, description, icon, and weblinks
- **Flexible token configuration** with decimal places, max supply, and transfer fees
- **Advanced permissions** including lock, auth, escrow, and transfer controls

### Token Management
- **MPToken Manager** for viewing and managing authorizations
- **Clean up tool** for removing unused token authorizations
- **Balance checker** to verify token holdings
- **Multi-wallet support** for checking any address

### Security & UX
- **Session persistence** - Resume your progress after page refresh
- **Wallet reconnection** - Easy reconnection when returning to the app
- **Error handling** - Clear error messages with troubleshooting guidance
- **Transaction validation** - Ensures all transactions are properly validated on-ledger

## 🛠️ Technical Stack

- **Frontend**: React 18 with Material-UI components
- **Blockchain**: XRPL (XRP Ledger) mainnet integration
- **Libraries**: xrpl.js v4.2.5 for blockchain interaction
- **Styling**: Tailwind CSS for responsive design

## 📋 Prerequisites

- An XRPL wallet with XRP for transaction fees
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of XRPL and token concepts

## 🚦 Getting Started

### Option 1: Use the Hosted Version
   - Visit the live app at [your-netlify-url.netlify.app](https://your-netlify-url.netlify.app)
   - No installation required

### Option 2: Run Locally

#### Quick Start (Unix/Linux/macOS):
```bash
./start.sh
```

#### Manual Setup:
```bash
# Clone this repository
git clone https://github.com/yourusername/mpt-minter.git
cd mpt-minter

# Install dependencies
cd frontend
npm install

# Start development server
npm run dev
```

The app will open at http://localhost:3000

2. **Connect Your Wallet**
   - Enter your wallet's secret key (starts with 's')
   - The app will connect to XRPL mainnet automatically

3. **Create Your Token**
   - Follow the step-by-step wizard
   - Configure your token properties
   - Review and create on mainnet

4. **Issue Tokens**
   - Authorize a holder wallet
   - Issue tokens to the authorized holder
   - Verify the transaction on-chain

## 💡 Usage Guide

### Creating a Token

1. **Token Information**
   - Symbol: 3-12 character identifier (e.g., "USD", "GOLD")
   - Name: Full descriptive name
   - Description: Detailed information about your token
   - Scale: Number of decimal places (0-15)

2. **Token Properties**
   - Maximum Supply: Total tokens that can exist (optional)
   - Transfer Fee: Percentage fee on transfers (0-50%)
   - Special Features: Lock, auth requirements, escrow, etc.

3. **Metadata (Optional)**
   - Icon URL: Link to token logo
   - Asset Class: Category (RWA, stablecoin, gaming, etc.)
   - Weblinks: Official sites, docs, social media

### Managing Tokens

Use the **MPT Manager** (bottom-right button) to:
- View all tokens you've created
- Check tokens you're authorized to hold
- Remove unused authorizations (zero balance)
- Inspect any wallet's token holdings

### Amount Entry

With the enhanced scaling system:
- Enter the actual amount you want (e.g., 1000 = 1000 tokens)
- The system automatically handles decimal conversion
- Scale only affects display precision, not entry

## 🔧 Troubleshooting

### tecNO_AUTH Error
This occurs when:
- The holder hasn't been authorized for the specific token
- You're trying to use an old authorization for a new token
- Solution: Use MPT Manager to check and clean up authorizations

### Connection Issues
- Ensure you're connected to the internet
- Check if XRPL mainnet is operational
- Try the reconnect button in the connection status

### Transaction Failures
- Verify sufficient XRP balance for fees
- Check all required fields are filled
- Review error messages for specific issues

## ⚠️ Security Notice

**This is an EXPERIMENTAL tool for TESTING and EDUCATIONAL purposes:**
- Never use with high-value mainnet wallets
- The tool stores data in browser session only
- No private keys are transmitted to any server
- Always use dedicated test wallets when experimenting

## 📊 XLS Compliance

This tool implements:
- **XLS-33**: Multi-Purpose Tokens (MPT) standard
- **XLS-0089d**: MPT metadata specification
- Full compliance with XRPL mainnet requirements

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- XRPL Foundation for the MPT standard
- Ripple for the xrpl.js library
- The XRPL community for testing and feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/EnchStyle/MPTminter/issues)
- **Documentation**: [XRPL MPT Docs](https://xrpl.org/docs/concepts/tokens/fungible-tokens/multi-purpose-tokens)
- **Community**: [XRPL Discord](https://discord.gg/xrpl)

## 🏗️ Building for Production

```bash
cd frontend
npm run build
```

The production files will be in `frontend/dist/` ready for deployment.

## 📁 Project Structure

```
mpt-minter/
├── frontend/              # React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── services/     # Business logic
│   │   ├── hooks/        # Custom React hooks
│   │   └── utils/        # Utilities
│   └── package.json
├── old-version/          # Original HTML files (backup)
├── netlify.toml          # Deployment configuration
└── start.sh             # Quick start script
```

---

**Disclaimer**: This tool interacts with the XRPL mainnet. Always verify transactions and use at your own risk. The authors are not responsible for any loss of funds or unintended token creation.