# Graph Report - .  (2026-04-13)

## Corpus Check
- 10 files · ~8,529 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 115 nodes · 183 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

## God Nodes (most connected - your core abstractions)
1. `getContract()` - 14 edges
2. `importKey()` - 8 edges
3. `connectWallet()` - 7 edges
4. `arrayBufferToBase64()` - 7 edges
5. `base64ToArrayBuffer()` - 7 edges
6. `packageForIPFS()` - 7 edges
7. `updateSummary()` - 6 edges
8. `validatePricePerAccess()` - 5 edges
9. `exportKey()` - 5 edges
10. `importRSAKey()` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.2
Nodes (21): arrayBufferToBase64(), base64ToArrayBuffer(), decryptAESKeyWithRSA(), decryptContent(), decryptText(), deriveKeyFromPassword(), encryptAESKeyWithRSA(), encryptContent() (+13 more)

### Community 1 - "Community 1"
Cohesion: 0.2
Nodes (17): addToWhitelist(), createRDO(), getContract(), getCreateRDOParamFields(), getEncryptedAESKey(), getEncryptionProfile(), getMyRDOIds(), getRDO() (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (6): copyToClipboard(), formatTxHash(), getExplorerLink(), getExplorerUrl(), LoadingState, showToast()

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (9): hidePriceError(), runStep(), selectAccess(), showPriceError(), togglePayPerOpen(), togglePerm(), updateMaxOpens(), updateSummary() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.42
Nodes (9): autoConnectWallet(), checkAndSwitchNetwork(), connectWallet(), hideButtonLoading(), setupProvider(), showButtonLoading(), showToast(), truncateAddress() (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.29
Nodes (6): addChip(), doAction(), loadRDOFromChain(), populateRdoDetails(), setPaymentStatus(), updateMonetizationBadge()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (2): fetchFromIPFS(), fetchJSONFromIPFS()

### Community 7 - "Community 7"
Cohesion: 0.4
Nodes (2): buildCard(), getStoredKeyParam()

### Community 8 - "Community 8"
Cohesion: 1.0
Nodes (0): 

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 8`** (2 nodes): `ABI()`, `contractAddress.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (2 nodes): `initRDOBackground()`, `background.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._