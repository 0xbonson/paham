# PAHAM

**Understand before you sign.**

PAHAM is a pre-sign transaction understanding and security layer for Web3. It helps users see what a blockchain transaction actually authorizes before they make the final signing decision.

- Live app: https://paham-eta.vercel.app
- Pre-sign demo: https://paham-eta.vercel.app/demo
- Network: BNB Smart Chain Testnet
- Built for: Indonesia Web3 Hackathon 2026

## Why PAHAM

Web3 interfaces describe actions in human language:

> Claim Reward  
> Mint  
> Swap  
> Continue

But wallets ultimately sign transaction calldata.

A button can communicate one intention while the encoded transaction grants broader authority than the user expects. PAHAM focuses on that gap.

## Core Idea: Semantic Diff

PAHAM makes the difference between user intent and transaction authority visible.

Example from the demo:

```text
WHAT THE USER EXPECTS

Claim 250 PTT

        ≠

WHAT THE TRANSACTION REQUESTS

approve(
  spender = 0x0000...dEaD
  amount  = MAX_UINT256
)

Unlimited PTT allowance
```

The goal is not to make the decision for the user. The goal is to expose the transaction clearly enough for the user to make an informed decision.

## Transaction X-Ray

PAHAM converts raw calldata into structured transaction facts.

For an ERC-20 approval, raw calldata beginning with:

```text
0x095ea7b3...
```

is decoded into information such as:

```text
Function
approve(address,uint256)

Spender
0x0000...dEaD

Allowance
MAX_UINT256

Human-readable consequence
Unlimited token allowance
```

Users can switch between the raw calldata view and PAHAM's decoded representation.

## How It Works

```text
Blockchain facts
      ↓
Deterministic decoder
      ↓
Risk rules
      ↓
On-chain context
      ↓
Plain-language AI explanation
```

Security-critical facts are decoded deterministically.

AI is used only to translate already verified transaction facts into simpler language. AI does **not** determine the transaction facts or the risk level.

## Current Prototype

PAHAM currently has two main experiences.

### Transaction Analyzer

The homepage can analyze BNB Smart Chain Testnet transactions and explain supported transaction types, including:

- ERC-20 `approve`
- ERC-20 `transfer`
- ERC-20 `transferFrom`
- NFT `setApprovalForAll`
- Native token transfers
- Unknown contract-call fallback

It also resolves available token metadata and highlights relevant permission risks.

### Pre-sign Security Demo

The `/demo` route demonstrates PAHAM operating between a dApp action and the wallet.

```text
Claim 250 PTT
      ↓
PAHAM reads the transaction
      ↓
Transaction X-Ray
      ↓
250 PTT ≠ Unlimited PTT
      ↓
Permission Path
      ↓
Reject Request / Continue to Wallet
      ↓
Rabby / MetaMask
```

If the user continues, the browser wallet receives a real BNB Smart Chain Testnet transaction.

## Test Contract

PAHAM uses a test ERC-20 token deployed on BNB Smart Chain Testnet.

**PAHAM Test Token (PTT)**

```text
Contract:
0x0ed5e77b023eb522EB10313CA2dc6A3aB50f28b6

Symbol:
PTT

Supply:
1,000,000 PTT
```

Example unlimited approval transaction:

```text
0xebdb2339eb5849558058ddacdd75daff5f94512d1ed5aa035b83864baa8f2e18
```

Demo spender:

```text
0x000000000000000000000000000000000000dEaD
```

The spender address is used only as a deterministic demonstration target. PAHAM does not claim that an address is malicious merely because an unlimited approval is requested.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- viem
- BNB Smart Chain Testnet
- Gemini API
- Vercel

## Run Locally

Clone the repository and install dependencies:

```bash
git clone https://github.com/0xbonson/paham.git
cd paham
npm install
```

Create `.env.local`:

```env
GEMINI_API_KEY=your_api_key_here
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
```

## Product Principle

PAHAM is not designed to make signing decisions for users.

> **Read the transaction, not the button.**

## Future Direction

The current prototype is delivered as a web application.

The same transaction-understanding engine could later be integrated into:

- Browser extensions
- Wallets
- dApps through an SDK or API
- Other pre-sign transaction flows

A future generalized intent-capture layer could extend Semantic Diff beyond the controlled demo and compare dApp intent with transaction authority across more Web3 applications.
