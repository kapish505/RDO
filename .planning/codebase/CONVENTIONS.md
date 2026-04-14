# Codebase Conventions

## Styling & Component Implementation

### HTML & Tailwind
- **Utilities First**: Rely on Tailwind CSS utility components directly on DOM elements.
- **Dynamic Manipulation**: Manipulate DOM Classlists explicitly inside vanilla JS via `element.classList.add()` / `remove()` ensuring explicit execution triggers for dynamic interactions.
- **IDs over Classes for Logic**: Application logic hooks explicitly into predefined `id="..."` attributes universally to avoid CSS refactoring breaking JS executions. Classes correlate strictly to CSS output styling behavior.

## Ethers.js Standards

### Transactions & Parsing 
- **Object Wrappers**: When packing solidity parameters (tuples into `struct`), always configure javascript Objects referencing precise names identically matching the `abi.json` definition parameters to securely format EVM packet limits implicitly enforcing exact payload schemas.
- **Error Capturing**: Transactions should be contained within `try ... catch` blocks resolving error strings back to users natively inside generic `showToast()` triggers ensuring complete UI feedback on silent RPC exceptions.
- **Defensive Parsing**: Always safely evaluate values mapping inputs recursively against EVM standards (e.g. tracking `null` / `undefined` evaluations to `0n` values or strings `'0'` depending on conversion requirements pre-transaction bounds.)

## Cross-Page Functional Integrity

- `showToast(msg, type)`: Execute universal alert mechanisms across files utilizing the canonically bound parameter ordering `showToast(message, type)` instead of deprecated reverse variables ensuring `shared.js` overwrites logic gracefully.
- `window.walletState`: Operate out of identical globally bound cache arrays. Do not create isolated logic definitions. Refresh internal state objects universally after metamask listener events explicitly emitting `walletStateChanged` globally.

## Security Controls

- **PKI Verifications**: Require functional fallback handlers and hard-halting stops if asynchronous cryptographic requirements fail. Execution flow inside generation components must hard-fail `throw new Error()` avoiding users permanently losing payload decryption access on miswritten contract deployments.
- **Local Storage Limitations**: Local state representations should strictly manage generic session configurations, entirely removing legacy fallback definitions of private cryptographic objects. Avoid `localStorage` logic binding to key-infrastructure protocols to defend against XSS vulnerabilities scaling laterally.
