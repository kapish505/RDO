const urlParams = new URLSearchParams(window.location.search);
const rdoId = urlParams.get('id');
const decryptionKey = urlParams.get('key'); // Exported key in Base64
let rdoDetails = null; // Store fetched RDO from contract

function loadRDO() {
  const val = document.getElementById('rdo-input').value.trim();
  if (!val) return;
  // Check if we have a stored key for this RDO
  let storedKey = '';
  try {
    const keys = JSON.parse(localStorage.getItem('rdo_keys') || '{}');
    if (keys[val]) storedKey = '&key=' + encodeURIComponent(keys[val]);
  } catch(e) {}
  window.location.href = `view.html?id=${val}${storedKey}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!rdoId) {
    return;
  }
  
  document.getElementById('rdo-id-title').innerText = `RDO #${rdoId}`;
  
  const loadingState = document.getElementById('loading-state');
  const detailState = document.getElementById('rdo-detail');
  
  loadingState.classList.remove('hidden');

  // Attempt to load RDO details from contract immediately
  try {
    if (window.ethereum) {
      await connectWallet(false); // Connect wallet silently
      rdoDetails = await getRDO(rdoId);
      populateRdoDetails(rdoDetails);
      
      loadingState.classList.add('hidden');
      detailState.classList.remove('hidden-section');
    } else {
      if(typeof showToast === 'function') showToast('Wallet required to fetch on-chain data', 'error');
    }
  } catch (err) {
    console.error("Failed to load RDO from contract:", err);
    loadingState.classList.add('hidden');
    if(typeof showToast === 'function') showToast('Failed to load RDO. Is the ID correct?', 'error');
  }
});

function populateRdoDetails(rdo) {
  document.getElementById('rdo-cid').innerText = `${rdo.ipfsCid.slice(0,10)}...${rdo.ipfsCid.slice(-10)}`;
  document.getElementById('rdo-creator').innerText = truncateAddress(rdo.creator);
  document.getElementById('rdo-access').innerText = formatAccessType(rdo.accessType);
  
  if(rdo.isLocked || rdo.isRevoked) {
    const statusEl = document.getElementById('rdo-status');
    statusEl.innerText = rdo.isRevoked ? 'REVOKED' : 'LOCKED';
    statusEl.classList.replace('text-primary', 'text-error');
    statusEl.classList.replace('bg-primary/10', 'bg-error/10');
    statusEl.classList.replace('border-primary/20', 'border-error/20');
  }

  // Check if max opens exhausted
  const isMaxed = rdo.maxOpens > 0 && rdo.openCount >= rdo.maxOpens;
  if (isMaxed) {
    const statusEl = document.getElementById('rdo-status');
    statusEl.innerText = 'MAX OPENS';
    statusEl.classList.replace('text-primary', 'text-amber-400');
    statusEl.classList.replace('bg-primary/10', 'bg-amber-400/10');
    statusEl.classList.replace('border-primary/20', 'border-amber-400/20');
  }

  const maxOpensStr = rdo.maxOpens == 0 ? '&infin;' : rdo.maxOpens;
  document.getElementById('rdo-opens').innerHTML = `${rdo.openCount} / ${maxOpensStr}`;
  
  if (rdo.maxOpens > 0) {
    const p = Math.min((rdo.openCount / rdo.maxOpens) * 100, 100);
    document.getElementById('opens-bar').style.width = p + '%';
  } else {
    document.getElementById('opens-bar').style.width = '0%';
  }

  // Permissions Chips
  const pc = document.getElementById('permissions-chips');
  pc.innerHTML = '';
  if (rdo.allowRead) addChip(pc, 'visibility', 'READ', 'bg-primary/10 text-primary border-primary/20');
  if (rdo.allowCopy) addChip(pc, 'content_copy', 'COPY', 'bg-blue-400/10 text-blue-400 border-blue-400/20');
  if (rdo.allowDownload) addChip(pc, 'download', 'DOWNLOAD', 'bg-green-400/10 text-green-400 border-green-400/20');
  if (rdo.lockOnViolation) addChip(pc, 'gavel', 'LOCK ON VIOLATION', 'bg-purple-400/10 text-purple-400 border-purple-400/20');

  // Disable action buttons for non-owners when RDO is inactive
  const isOwner = window.walletState.address && window.walletState.address.toLowerCase() === rdo.creator.toLowerCase();
  const isInactive = rdo.isRevoked || rdo.isLocked || isMaxed;

  if (isInactive && !isOwner) {
    ['btn-read', 'btn-copy', 'btn-download'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-40', 'cursor-not-allowed');
      }
    });
  }

  // Owner actions — show contextually
  if (isOwner) {
    document.getElementById('owner-actions').classList.remove('hidden');
    const revokeBtn = document.querySelector('#owner-actions button:nth-child(1)');
    const unlockBtn = document.querySelector('#owner-actions button:nth-child(2)');
    // Hide revoke if already revoked
    if (rdo.isRevoked && revokeBtn) {
      revokeBtn.disabled = true;
      revokeBtn.innerText = 'ALREADY REVOKED';
      revokeBtn.classList.add('opacity-40', 'cursor-not-allowed');
    }
    // Only show unlock if actually locked
    if (unlockBtn) {
      if (rdo.isLocked && !rdo.isRevoked) {
        unlockBtn.classList.remove('hidden');
      } else {
        unlockBtn.classList.add('hidden');
      }
    }
  }
}

function addChip(container, icon, label, classes) {
  const c = document.createElement('div');
  c.className = `flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-bold font-label tracking-widest ${classes}`;
  c.innerHTML = `<span class="material-symbols-outlined text-[14px]">${icon}</span> ${label}`;
  container.appendChild(c);
}

// ── App Actions ───────────────────────────────────────────
async function doAction(action) {
  if (!rdoId) return;

  const resultContainer = document.getElementById('access-result-content');
  resultContainer.innerHTML = '<span class="text-xs text-primary animate-pulse">Requesting access...</span>';

  try {
    if(!window.walletState.address) {
      await connectWallet();
      if(!window.walletState.address) throw new Error("Wallet connection required.");
    }

    const isOwner = rdoDetails && rdoDetails.creator && 
      window.walletState.address.toLowerCase() === rdoDetails.creator.toLowerCase();

    // 1. Check Smart Contract Permission (skip for owner — their opens shouldn't count)
    if (!isOwner) {
      const accessResult = await requestAccess(rdoId, action);
      if (!accessResult || !accessResult.allowed) {
        const reason = accessResult?.reason || 'Permission denied';
        throw new Error(`Access Denied: ${reason}`);
      }
    } else {
      // Owner still needs to check if their permission type is enabled
      if (action === 'read' && rdoDetails && !rdoDetails.allowRead) throw new Error('Read not enabled on this RDO');
      if (action === 'copy' && rdoDetails && !rdoDetails.allowCopy) throw new Error('Copy not enabled on this RDO');
      if (action === 'download' && rdoDetails && !rdoDetails.allowDownload) throw new Error('Download not enabled on this RDO');
    }

    // 2. Fetch IPFS Data — need rdoDetails populated first
    if (!rdoDetails || !rdoDetails.ipfsCid) {
      throw new Error('RDO details not loaded yet. Please wait a moment and try again.');
    }
    resultContainer.innerHTML = '<span class="text-xs text-primary animate-pulse">Fetching IPFS Payload...</span>';
    const payload = await fetchJSONFromIPFS(rdoDetails.ipfsCid);
    
    // 3. Decrypt Payload
    let keyToUse = decryptionKey;
    // Try localStorage if key isn't in URL
    if (!keyToUse && rdoId) {
      try {
        const storedKeys = JSON.parse(localStorage.getItem('rdo_keys') || '{}');
        if (storedKeys[rdoId.toString()]) keyToUse = storedKeys[rdoId.toString()];
      } catch(e) {}
    }
    // Last resort: ask the user
    if (!keyToUse) {
      keyToUse = prompt("Enter the Decryption Key to view this content:");
      if (!keyToUse) throw new Error("Missing decryption key.");
    }
    resultContainer.innerHTML = '<span class="text-xs text-primary animate-pulse">Decrypting content...</span>';
    const decryptedJSON = await unpackageFromIPFS(JSON.stringify(payload), keyToUse);
    
    // Decrypted Content logic - parse the bundle we made in create.js
    const bundle = JSON.parse(decryptedJSON.content);

    // Display appropriate result
    resultContainer.innerHTML = `<span class="text-xs text-green-400">Successfully decrypted! Action: ${action.toUpperCase()}</span>`;
    
    if (action === 'read') {
      document.getElementById('content-viewer').classList.remove('hidden-section');
      const dsp = document.getElementById('content-display');
      
      dsp.innerHTML = '';
      if (bundle.text) {
        dsp.appendChild(Object.assign(document.createElement('p'), { 
          innerText: bundle.text,
          className: 'whitespace-pre-wrap mb-4 font-sans text-on-surface'
        }));
      }
      if (bundle.file) {
        // If file is an image, display it, else provide a link
        if (bundle.mimeType && bundle.mimeType.startsWith('image/')) {
          dsp.appendChild(Object.assign(document.createElement('img'), {
            src: bundle.file,
            className: 'max-w-full rounded mt-4'
          }));
        } else {
           const a = Object.assign(document.createElement('a'), {
             href: bundle.file,
             download: bundle.fileName,
             innerText: `📁 Download Attached File: ${bundle.fileName || 'file'}`,
             className: 'text-primary underline'
           });
           dsp.appendChild(a);
        }
      }
    } 
    else if (action === 'copy') {
      let combined = bundle.text || '';
      if(bundle.file) combined += `\n[File attachment available: ${bundle.fileName}]`;
      navigator.clipboard.writeText(combined);
      if(typeof showToast === 'function') showToast('Content copied to clipboard!', 'success');
    }
    else if (action === 'download') {
      if (bundle.file) {
        const a = document.createElement('a');
        a.href = bundle.file;
        a.download = bundle.fileName || 'decrypted-file';
        a.click();
      } else if (bundle.text) {
        const blob = new Blob([bundle.text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `rdo-${rdoId.slice(0,8)}.txt`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }
  } catch (err) {
    console.error(err);
    resultContainer.innerHTML = `<span class="text-xs text-error font-bold">Failed:</span> <span class="text-xs text-on-surface">${err.message}</span>`;
  }
}

async function revokeRDOAction() {
  try {
    await revokeRDO(rdoId);
    if(typeof showToast === 'function') showToast('RDO Revoked', 'success');
    setTimeout(() => location.reload(), 2000);
  } catch(e) {
    if(typeof showToast === 'function') showToast(e.message, 'error');
  }
}

async function unlockRDOAction() {
  try {
    await unlockRDO(rdoId);
    if(typeof showToast === 'function') showToast('RDO Unlocked', 'success');
    setTimeout(() => location.reload(), 2000);
  } catch(e) {
    if(typeof showToast === 'function') showToast(e.message, 'error');
  }
}

