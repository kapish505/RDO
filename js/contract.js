/* ============================================
   contract.js - Smart Contract Interactions
   ============================================ */

let rdoContract = null;

let createParamFieldsCache = null;

async function getContract(requireSigner = false) {
  if (!walletState.provider) {
    throw new Error('Wallet not connected. Please connect your wallet first.');
  }

  const abi = await loadABI();

  if (requireSigner) {
    if (!walletState.signer) throw new Error('No signer available.');
    return new ethers.Contract(CONTRACT_ADDRESS, abi, walletState.signer);
  } else {
    return new ethers.Contract(CONTRACT_ADDRESS, abi, walletState.provider);
  }
}

async function loadABI() {
  try {
    const response = await fetch('./abi.json');
    if (!response.ok) throw new Error('Failed to load ABI');
    return await response.json();
  } catch (error) {
    console.error('ABI load error:', error);
    throw error;
  }
}

async function getCreateRDOParamFields() {
  if (createParamFieldsCache) return createParamFieldsCache;
  const abi = await loadABI();
  const createFn = abi.find((item) => item.type === 'function' && item.name === 'createRDO');
  const components = createFn?.inputs?.[0]?.components || [];
  createParamFieldsCache = new Set(components.map((c) => c.name));
  return createParamFieldsCache;
}

// ── Create RDO ──────────────────────────────
async function createRDO(paramsObj) {
  const contract = await getContract(true);
  const supportedFields = await getCreateRDOParamFields();

  // Keep backward compatibility with older deployed contracts that do not yet
  // expose monetization fields in CreateRDOParams.
  const safeParams = Object.fromEntries(
    Object.entries(paramsObj).filter(([key]) => supportedFields.has(key))
  );

  // Pre-calculate the ID by doing a static call before sending the transaction!
  let rdoId = null;
  try {
    const predictedId = await contract.createRDO.staticCall(safeParams);
    rdoId = predictedId.toString();
  } catch (e) {
    console.warn("staticCall failed to predict rdoId:", e);
  }

  const tx = await contract.createRDO(safeParams);
  const receipt = await tx.wait();

  // Try parsing from event if staticCall failed
  if (!rdoId) {
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'RDOCreated';
      } catch { return false; }
    });

    if (event) {
      const parsed = contract.interface.parseLog(event);
      rdoId = parsed.args.rdoId.toString();
    }
  }
  
  // Last resort fallback: try to scrape the first topic of any log
  if (!rdoId && receipt.logs && receipt.logs.length > 0) {
    for (const log of receipt.logs) {
      if (log.topics && log.topics.length > 1) {
        // usually indexed rdoId is topics[1]
        try {
          rdoId = parseInt(log.topics[1], 16).toString();
          if (rdoId && rdoId !== 'NaN') break;
        } catch(err) { /* skip */ }
      }
    }
  }

  return {
    rdoId,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

// ── Get RDO Info ────────────────────────────
async function getRDO(rdoId, providerOverride) {
  // Allow passing provider/signer directly for flexibility
  const origProvider = walletState.provider;
  if (providerOverride && !walletState.provider) walletState.provider = providerOverride;

  const contract = await getContract(false);

  if (providerOverride && !origProvider) walletState.provider = null;

  const result = await contract.getRDO(rdoId);

  // getRDO returns an RDOView struct — ethers.js exposes both named fields and indices
  return {
    id:               rdoId.toString(),
    creator:          result.creator,
    ipfsCid:          result.ipfsCid,
    accessType:       Number(result.accessType),
    isWhitelist:      Number(result.accessType) === 1,
    allowRead:        result.allowRead,
    allowCopy:        result.allowCopy,
    allowDownload:    result.allowDownload,
    isPaid:           !!result.isPaid,
    pricePerAccess:   result.pricePerAccess ?? 0n,
    pricePerAccessEth: result.isPaid && (result.pricePerAccess ?? 0n) ? ethers.formatEther(result.pricePerAccess ?? 0n) : '0',
    maxOpens:         Number(result.maxOpens),
    openCount:        Number(result.openCount),
    lockOnViolation:  result.lockOnViolation,
    isLocked:         result.isLocked,
    isRevoked:        result.isRevoked,
    isActive:         !result.isLocked && !result.isRevoked,
    createdAt:        Number(result.createdAt),
    events:           []
  };
}

// ── Request Access ──────────────────────────
async function requestAccess(rdoId, action, paymentEth = '0') {
  const contract = await getContract(true);

  showToast(`Requesting ${action} access...`, 'info');

  const paymentWei = ethers.parseEther(String(paymentEth || '0'));
  const tx = await contract.requestAccess(rdoId, action, { value: paymentWei });
  showToast('Tx submitted. Confirming...', 'info');

  const receipt = await tx.wait();

  // Parse RDOAccessed event
  let accessResult = null;
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed && parsed.name === 'RDOAccessed') {
        accessResult = {
          allowed: parsed.args.allowed,
          reason:  parsed.args.reason,
          action:  parsed.args.action
        };
        break;
      }
    } catch { /* skip */ }
  }

  return {
    ...accessResult,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
}

// ── Revoke RDO ──────────────────────────────
async function revokeRDO(rdoId) {
  const contract = await getContract(true);
  const tx = await contract.revokeRDO(rdoId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// Alias for pages that call revokeRDOContract(rdoId, signer)
async function revokeRDOContract(rdoId, signer) {
  const origSigner = walletState.signer;
  if (signer) walletState.signer = signer;
  const result = await revokeRDO(rdoId);
  walletState.signer = origSigner;
  return result.txHash;
}

// ── Unlock RDO ──────────────────────────────
async function unlockRDO(rdoId) {
  const contract = await getContract(true);
  const tx = await contract.unlockRDO(rdoId);
  const receipt = await tx.wait();
  return { txHash: receipt.hash };
}

// Alias for pages that call unlockRDOContract(rdoId, signer)
async function unlockRDOContract(rdoId, signer) {
  const origSigner = walletState.signer;
  if (signer) walletState.signer = signer;
  const result = await unlockRDO(rdoId);
  walletState.signer = origSigner;
  return result.txHash;
}

// ── Encryption Profile API ──────────────────
async function getEncryptionProfile(address) {
  const contract = await getContract(false);
  try {
    const jsonStr = await contract.encryptionPubKeys(address);
    if (!jsonStr || jsonStr.trim() === '') return null;
    return jsonStr;
  } catch (err) {
    console.error("Failed to load profile:", err);
    return null;
  }
}

async function registerEncryptionProfile(jsonProfileStr) {
  const contract = await getContract(true);
  showToast('Registering Encryption Profile on-chain...', 'info');
  const tx = await contract.registerEncryptionKey(jsonProfileStr);
  const receipt = await tx.wait();
  return receipt.hash;
}

async function getEncryptedAESKey(rdoId, address) {
  const contract = await getContract(false);
  try {
    return await contract.getEncryptedKey(rdoId, address);
  } catch (err) {
    console.error("Failed to load encrypted AES key:", err);
    return null;
  }
}

// ── Add to Whitelist ────────────────────────
async function addToWhitelist(rdoId, addresses) {
  const contract = await getContract(true);

  const tx = await contract.addToWhitelist(rdoId, addresses);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

// ── Check Whitelist ─────────────────────────
async function isWhitelisted(rdoId, address) {
  const contract = await getContract(false);
  return await contract.isWhitelisted(rdoId, address);
}

// ── Get My RDO IDs ───────────────────────────
async function getMyRDOIds() {
  const contract = await getContract(false);
  
  let maxFound = 0;
  try {
    const counterStr = await contract.rdoCounter();
    maxFound = Number(counterStr);
  } catch (err) {
    console.error("Failed to read rdoCounter directly, returning 0:", err);
    return [];
  }
  
  if (maxFound === 0) return [];
  
  // Now fetch all to find which belong to user
  const promises = [];
  for (let i = 1; i <= maxFound; i++) {
    promises.push(contract.getRDO(i).then(rdo => {
      if (rdo && rdo.creator && rdo.creator.toLowerCase() === window.walletState.address.toLowerCase()) {
        return i;
      }
      return null;
    }).catch(() => null));
  }
  
  const results = await Promise.all(promises);
  return results.filter(id => id !== null).reverse();
}

// ── Get Event Logs ──────────────────────────
async function getRDOEvents(rdoId) {
  const contract = await getContract(false);

  const filter = {
    address: CONTRACT_ADDRESS,
    fromBlock: 0,
    toBlock: 'latest'
  };

  const logs = await walletState.provider.getLogs(filter);
  const events = [];

  const abi = await loadABI();
  const iface = new ethers.Interface(abi);

  for (const log of logs) {
    try {
      const parsed = iface.parseLog(log);
      if (!parsed) continue;

      const args = parsed.args;
      const eventRdoId = args.rdoId ? args.rdoId.toString() : null;

      if (eventRdoId === rdoId.toString()) {
        const block = await walletState.provider.getBlock(log.blockNumber);
        events.push({
          event:  parsed.name,
          args,
          txHash: log.transactionHash,
          block:  log.blockNumber,
          time:   block ? new Date(Number(block.timestamp) * 1000).toLocaleString() : 'Unknown'
        });
      }
    } catch { /* skip */ }
  }

  return events.reverse(); // newest first
}

// ── Format helpers ───────────────────────────
function formatAccessType(type) {
  return type === 0 ? 'Public' : type === 1 ? 'Whitelist' : 'Unknown';
}

function getRDOStatus(rdo) {
  if (rdo.isRevoked) return { label: 'Revoked', type: 'error' };
  if (rdo.isLocked)  return { label: 'Locked',  type: 'error' };
  if (rdo.maxOpens > 0 && rdo.openCount >= rdo.maxOpens) {
    return { label: 'Exhausted', type: 'neutral' };
  }
  return { label: 'Active', type: 'success' };
}
