# MPT Authorization Guide

## Understanding Token Authorization

The **Require Authorization** feature in MPT tokens creates a whitelist system where only pre-approved addresses can hold your tokens.

## How It Works

### Without "Require Authorization" (Default)
- ✅ **Anyone can receive tokens** directly from the issuer
- ✅ Tokens can be freely traded on DEX
- ✅ Tokens can be sent peer-to-peer between any addresses
- ✅ No authorization step needed before sending tokens
- 📝 This is how most fungible tokens work

### With "Require Authorization" Enabled
- 🔒 **Only authorized addresses can receive tokens**
- ❌ Recipients CANNOT receive tokens without prior authorization
- ❌ Tokens CANNOT be traded on DEX by unauthorized holders
- ❌ Even if someone tries to send tokens, unauthorized addresses cannot receive them
- ⚠️ You must authorize EVERY recipient before sending tokens

## The Authorization Flow

### For Unrestricted Tokens (requireAuth = false):
1. Create token
2. Send tokens directly to any address
3. Recipients can immediately use/trade tokens

### For Restricted Tokens (requireAuth = true):
1. Create token with "Require Authorization" enabled
2. **Authorize recipient** using MPTokenAuthorize transaction
3. Send tokens to the authorized address
4. Only then can the recipient hold/use tokens

## Use Cases

### When to Use "Require Authorization":
- **Private tokens** - Company shares, membership tokens
- **Compliance tokens** - KYC/AML required assets
- **Restricted distribution** - Employee tokens, rewards programs
- **Controlled ecosystems** - Game tokens with anti-bot measures

### When NOT to Use:
- **Public tokens** - General purpose cryptocurrencies
- **DEX trading** - Tokens meant for open market trading
- **Wide distribution** - Airdrops, community tokens
- **DeFi tokens** - Tokens used in decentralized protocols

## Important Notes

1. **Authorization is permanent** - Once authorized, you cannot revoke it (unless you have clawback enabled)
2. **No retroactive changes** - You cannot add/remove requireAuth after token creation
3. **Issuer burden** - You must manually authorize every single holder
4. **No DEX trading** - Authorized holders still cannot trade on DEX if new buyers aren't authorized

## Technical Details

- Authorization uses `MPTokenAuthorize` transaction
- Flag: `lsfMPTRequireAuth` (0x0002)
- Check authorization status before sending tokens
- Payment transactions will fail to unauthorized addresses