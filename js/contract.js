/* ============================================
   contract.js - Smart Contract Interactions
   ============================================ */

let rdoContract = null;

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

// ── Create RDO ──────────────────────────────
// Accepts either (params object) or (ipfsCid, maxOpens, isWhitelist, lockOnViolation, read, copy, download, signer)
async function createRDO(ipfsCidOrParams, maxOpens, isWhitelist, lockOnViolation, allowRead, allowCopy, allowDownload, signerOverride) {
  let params;
  if (typeof ipfsCidOrParams === 'object' && !ipfsCidOrParams.length) {
    params = ipfsCidOrParams;
  } else {
    params = {
      ipfsCid: ipfsCidOrParams,
      accessType: isWhitelist ? 1 : 0,
      allowRead,
      allowCopy,
      allowDownload,
      maxOpens,
      lockOnViolation,
      whitelist: []
    };
  }

  const { ipfsCid, accessType, whitelist = [] } = params;

  // Temporarily override signer if provided
  const origSigner = walletState.signer;
  if (signerOverride) walletState.signer = signerOverride;

  const contract = await getContract(true);
  if (signerOverride) walletState.signer = origSigner;

  const tx = await contract.createRDO(
    ipfsCid,
    accessType !== undefined ? accessType : (params.isWhitelist ? 1 : 0),
    params.allowRead,
    params.allowCopy,
    params.allowDownload,
    params.maxOpens,
    params.lockOnViolation,
    whitelist
  );

  const receipt = await tx.wait();

  // Parse RDOCreated event
  const event = receipt.logs.find(log => {
    try {
      const parsed = contract.interface.parseLog(log);
      return parsed && parsed.name === 'RDOCreated';
    } catch { return false; }
  });

  let rdoId = null;
  if (event) {
    const parsed = contract.interface.parseLog(event);
    rdoId = parsed.args.rdoId.toString();
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
async function requestAccess(rdoId, action) {
  const contract = await getContract(true);

  showToast(`Requesting ${action} access...`, 'info');

  const tx = await contract.requestAccess(rdoId, action);
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

// ── Get RDO Counter ─────────────────────────
async function getRdoCounter() {
  const contract = await getContract(false);
  const count = await contract.rdoCounter();
  return Number(count);
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
