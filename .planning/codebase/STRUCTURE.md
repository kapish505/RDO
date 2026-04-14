# Project Directory Structure

``` text
RDO-2/
├── .planning/
│   └── codebase/       # Architecture maps, workflows, and health artifacts
│       ├── ARCHITECTURE.md
│       ├── CONCERNS.md
│       ├── CONVENTIONS.md
│       ├── INTEGRATIONS.md
│       ├── STACK.md
│       ├── STRUCTURE.md
│       └── TESTING.md
├── contracts/
│   └── RDO.sol         # The single deployed EVM smart contract logic layer
├── css/
│   ├── animations.css  # Abstract structural and 3D visual FX code
│   └── style.css       # Core token variables, standard properties
├── graphify-out/       # Auto-generated dependency graph analysis output (via uv)
├── js/
│   ├── background.js   # THREE.js starfield instance code
│   ├── contract.js     # Master ethers.js ABI execution logic & abstraction handlers
│   ├── create.js       # Payload bundling, file handling, struct configuration logic
│   ├── crypto.js       # WebCrypto AES/RSA engine implementation 
│   ├── dashboard.js    # Data scraping logic for building Object Tracking Grids
│   ├── shared.js       # Toast, Modals, Navbar scroll and pure DOM utilities
│   ├── view.js         # Decryption loading workflows, Event rendering overrides
│   └── wallet.js       # Window object injection hooks & MetaMask initialization
├── abi.json            # Parsed Application Binary Interface output of RDO.sol
├── contractAddress.js  # Crucial master configuration variables (Contract & Pinata)
├── create.html         # User creation interface
├── dashboard.html      # Creator management screen (revoke, view limits)
├── index.html          # Gateway and Wallet bridging screen
├── vercel.json         # Static network bridging and routing configuration
└── view.html           # Public interaction layer for object reading and transactions
```

## Structural Philosophy

The project utilizes a pure functional flat-file structure organized by domain expertise rather than heavy routing paradigms strictly avoiding Single Page Application (SPA) bloat.
Each page (`.html`) correlates strongly to specific functional subsets inside `js/`, eliminating cross-contamination of execution environments.

### The `contractAddress.js` Config Node
Used heavily across all frontend pages as a global bootstrap file injecting `CONTRACT_ADDRESS` into the application lifecycle. Altering the variable string requires reloading active dependencies locally via Browser Refresh parameters.
