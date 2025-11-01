# Encrypted Trust Score Tracker

A privacy-preserving application for couples to record and track trust events using Fully Homomorphic Encryption (FHE). Built with FHEVM protocol by Zama, this application allows users to record trust scores, view encrypted statistics, and decrypt their personal trust history while keeping all data private.

## Features

- **Encrypted Trust Recording**: Record trust events with scores (1-10) that are encrypted before storage
- **Private Statistics**: View encrypted total scores, event counts, and averages
- **Decrypt History**: Decrypt and view your personal trust score history
- **Rainbow Wallet Integration**: Connect using Rainbow wallet for a seamless experience
- **Fully Homomorphic Encryption**: All operations on trust scores are performed on encrypted data

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager
- **Rainbow Wallet**: Browser extension wallet

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd frontend
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network (in another terminal)
   npx hardhat deploy --network localhost
   # Generate ABI files for frontend
   cd frontend
   npm run genabi
   ```

5. **Run the frontend**

   ```bash
   cd frontend
   npm run dev:mock
   ```

6. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   # Generate ABI files
   cd frontend
   npm run genabi
   ```

## 📁 Project Structure

```
pro24/
├── contracts/                    # Smart contract source files
│   └── TrustScoreTracker.sol    # Main FHE trust score tracker contract
├── deploy/                       # Deployment scripts
├── tasks/                        # Hardhat custom tasks
├── test/                         # Test files
│   ├── TrustScoreTracker.ts      # Local tests
│   └── TrustScoreTrackerSepolia.ts # Sepolia tests
├── frontend/                     # Next.js frontend application
│   ├── app/                      # Next.js app directory
│   ├── components/               # React components
│   ├── hooks/                    # Custom React hooks
│   └── abi/                      # Generated contract ABIs
├── hardhat.config.ts            # Hardhat configuration
└── package.json                  # Dependencies and scripts
```

## 📜 Available Scripts

| Script             | Description                      |
| ------------------ | -------------------------------- |
| `npm run compile`  | Compile all contracts            |
| `npm run test`     | Run all tests                    |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate coverage report         |
| `npm run lint`     | Run linting checks               |
| `npm run clean`    | Clean build artifacts            |

## 🎯 Usage

### Recording Trust Events

1. Connect your Rainbow wallet
2. Enter a trust score between 1-10
3. Click "Record Trust Event"
4. Confirm the transaction in your wallet

### Viewing Trust Statistics

- **Total Score**: Sum of all recorded trust scores (encrypted)
- **Event Count**: Number of trust events recorded
- **Average Score**: Average of all trust scores (encrypted)

### Decrypting Scores

Click "Decrypt Scores" to decrypt and view your personal trust history. This operation requires your wallet signature and decrypts the data locally.

## 🔒 Privacy & Security

- All trust scores are encrypted using FHE before being stored on-chain
- Only you can decrypt your personal trust scores
- Encrypted operations (sum, average) are performed without decrypting the data
- No third party can view your trust event details

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ using FHEVM by Zama**
