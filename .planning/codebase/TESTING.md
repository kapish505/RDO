# Testing

## Current State

**No automated tests exist.** The project has:

- ❌ No unit tests
- ❌ No integration tests
- ❌ No end-to-end tests
- ❌ No test framework configured (no Jest, Mocha, Vitest, Cypress, etc.)
- ❌ No test runner or npm scripts
- ❌ No CI/CD pipeline
- ❌ No Solidity test suite (no Hardhat/Foundry tests)
- ❌ No `package.json` at all

## Manual Testing Infrastructure

### Browser Console Testing

The codebase exposes `window.RDO_CONFIG` (in `contractAddress.js`) for manual console testing:

```javascript
window.RDO_CONFIG = {
  CONTRACT_ADDRESS,
  get ABI() { return []; }  // Placeholder; real ABI loaded via loadABI()
};
```

### Pinata Connection Test

`js/ipfs.js` exports `testPinataConnection()` for verifying API key setup:

```javascript
const result = await testPinataConnection();
// { success: true, message: "..." } or { success: false, message: "..." }
```

### Demo Mode

When Pinata API keys are placeholder values (`'YOUR_PINATA_API_KEY'`), the IPFS upload functions return fake CIDs, allowing the creation flow to be tested without a real Pinata account.

### Footer Links

Some pages link to a `test.html` page in the footer (e.g., `create.html` line 408, `view.html` line 327), but this file **does not exist** in the repository.

## Testing Recommendations

### Priority 1: Smart Contract Tests

The Solidity contract (`contracts/RDO.sol`) is the most critical component and currently has zero tests. Recommended:

- Set up Hardhat or Foundry
- Test all contract functions: `createRDO`, `requestAccess`, `revokeRDO`, `unlockRDO`, `addToWhitelist`, `removeFromWhitelist`
- Test access control modifiers (`onlyCreator`, `rdoExists`, `rdoActive`)
- Test violation handling and auto-lock logic
- Test monetization payment flow (correct amount, refund on failure)
- Test edge cases: max opens exhaustion, double revoke, creator bypass

### Priority 2: Crypto Module Tests

`js/crypto.js` contains complex cryptographic operations that could break silently:

- AES-256-GCM encrypt → decrypt roundtrip
- RSA-OAEP key generation → export → import roundtrip
- AES key wrapping/unwrapping via RSA
- PKI profile generation → recovery roundtrip
- Edge cases: empty content, large files, binary vs text

### Priority 3: End-to-End Flow Tests

Full create → view → access flow:

- Create RDO with public access → view → read successfully
- Create RDO with whitelist → non-whitelisted user denied
- Create paid RDO → payment required for access
- Create RDO → revoke → access denied
- Create RDO → exceed max opens → auto-lock

## Verification Methods Currently Used

The project relies entirely on **manual browser testing**:

1. Open `create.html` in browser with MetaMask
2. Fill form, run 3-step process
3. Navigate to `view.html` with resulting RDO ID
4. Test read/copy/download actions
5. Test revoke/unlock from `dashboard.html`
6. Check Etherscan for transaction confirmation
