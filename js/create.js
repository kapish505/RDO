let selectedFile = null;

// Copy helpers for success card
function copyRdoId() {
  const text = document.getElementById('rdo-id-display')?.innerText;
  if (text) { navigator.clipboard.writeText(text); if(typeof showToast === 'function') showToast('RDO ID copied!', 'success'); }
}
function copyDecryptionKey() {
  const text = document.getElementById('decryption-key-display')?.innerText;
  if (text) { navigator.clipboard.writeText(text); if(typeof showToast === 'function') showToast('Decryption key copied!', 'success'); }
}
function copyShareLink() {
  const shareEl = document.getElementById('share-link-display');
  const feedback = document.getElementById('share-copy-feedback');
  if (!shareEl || !shareEl.innerText) return;

  navigator.clipboard.writeText(shareEl.innerText);
  if (typeof showToast === 'function') showToast('Share link copied!', 'success');
  if (feedback) {
    feedback.classList.remove('hidden');
    feedback.classList.add('copied-flash');
    setTimeout(() => {
      feedback.classList.remove('copied-flash');
      feedback.classList.add('hidden');
    }, 1200);
  }
}

let rdoConfig = {
  maxOpens: 100,
  accessType: 'public',
  allowRead: true,   // always true — read toggle removed from UI
  allowCopy: true,
  allowDownload: false,
  lockOnViolation: true,
  isPaid: false,
  pricePerAccessEth: ''
};

let rdoState = {
  encryptedPayload: null,
  exportedKey: null,
  ipfsCid: null
};

document.addEventListener('DOMContentLoaded', () => {
  const priceInput = document.getElementById('price-per-access');
  if (priceInput) {
    priceInput.addEventListener('input', () => validatePricePerAccess());
  }
  updateSummary();
});

// ── File Selection ───────────────────────────────────────
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedFile = file;
    document.getElementById('file-info').classList.remove('hidden');
    document.getElementById('file-name').innerText = file.name;
    document.getElementById('file-size').innerText = (file.size / 1024).toFixed(2) + ' KB';
  }
}

function clearFile() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('file-info').classList.add('hidden');
}

// ── UI Config ─────────────────────────────────────────────
function updateMaxOpens(val) {
  rdoConfig.maxOpens = Number(val);
  const valEl = document.getElementById('max-opens-display');
  if (valEl) {
    valEl.innerText = rdoConfig.maxOpens === 0 ? 'Unlimited' : rdoConfig.maxOpens;
  }
  updateSummary();
}

function updateSummary() {
  document.getElementById('s-access').innerText = rdoConfig.accessType === 'public' ? 'Public' : 'Whitelist';
  
  const setStatus = (id, allowed) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = allowed ? 'Allowed' : 'Denied';
    el.className = allowed ? 'text-sm font-medium text-on-surface' : 'text-sm font-medium text-secondary';
  };
  
  setStatus('s-copy', rdoConfig.allowCopy);
  setStatus('s-download', rdoConfig.allowDownload);
  
  document.getElementById('s-max').innerText = rdoConfig.maxOpens === 0 ? 'Unlimited' : rdoConfig.maxOpens;

  const lockEl = document.getElementById('s-lock');
  if (lockEl) {
    lockEl.innerText = rdoConfig.lockOnViolation ? 'Enabled' : 'Disabled';
    lockEl.className = rdoConfig.lockOnViolation ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-secondary';
  }

  const paidEl = document.getElementById('s-paid');
  if (paidEl) {
    paidEl.innerText = rdoConfig.isPaid ? 'Paid' : 'Free';
    paidEl.className = rdoConfig.isPaid ? 'text-[15px] font-medium text-amber-400' : 'text-[15px] font-medium text-emerald-400';
  }

  const priceEl = document.getElementById('s-price');
  if (priceEl) {
    const price = rdoConfig.isPaid ? (rdoConfig.pricePerAccessEth || '0') : '0';
    priceEl.innerText = `${price} ETH`;
    priceEl.className = rdoConfig.isPaid ? 'text-[15px] font-mono text-amber-300' : 'text-[15px] font-mono text-secondary';
  }
}

function togglePayPerOpen(btn) {
  rdoConfig.isPaid = !rdoConfig.isPaid;
  const priceWrap = document.getElementById('price-input-wrap');
  const dot = btn.querySelector('div');

  if (rdoConfig.isPaid) {
    btn.classList.add('bg-primary');
    btn.classList.remove('bg-surface-container-highest');
    btn.dataset.state = 'on';
    dot?.classList.add('ml-auto', 'bg-white');
    dot?.classList.remove('bg-outline');
    priceWrap?.classList.remove('hidden');
  } else {
    btn.classList.remove('bg-primary');
    btn.classList.add('bg-surface-container-highest');
    btn.dataset.state = 'off';
    dot?.classList.remove('ml-auto', 'bg-white');
    dot?.classList.add('bg-outline');
    priceWrap?.classList.add('hidden');
    hidePriceError();
  }

  updateSummary();
}

function validatePricePerAccess() {
  const input = document.getElementById('price-per-access');
  if (!input) return false;
  rdoConfig.pricePerAccessEth = input.value.trim();

  if (!rdoConfig.isPaid) {
    hidePriceError();
    return true;
  }

  const value = Number(rdoConfig.pricePerAccessEth);
  const ok = Number.isFinite(value) && value > 0;
  if (!ok) showPriceError();
  else hidePriceError();
  updateSummary();
  return ok;
}

function showPriceError() {
  document.getElementById('price-error')?.classList.remove('hidden');
}

function hidePriceError() {
  document.getElementById('price-error')?.classList.add('hidden');
}


function selectAccess(type) {
  rdoConfig.accessType = type;
  const btnPublic = document.getElementById('card-public');
  const btnWhitelist = document.getElementById('card-whitelist');
  const whitelistInput = document.getElementById('whitelist-input-container');
  
  if (type === 'public') {
    btnPublic.classList.add('border-primary');
    btnPublic.classList.remove('border-[#474750]/20', 'hover:border-[#474750]/50');
    
    btnWhitelist.classList.add('border-[#474750]/20', 'hover:border-[#474750]/50');
    btnWhitelist.classList.remove('border-primary');
    
    if (whitelistInput) whitelistInput.classList.add('hidden');
  } else {
    btnWhitelist.classList.add('border-primary');
    btnWhitelist.classList.remove('border-[#474750]/20', 'hover:border-[#474750]/50');
    
    btnPublic.classList.add('border-[#474750]/20', 'hover:border-[#474750]/50');
    btnPublic.classList.remove('border-primary');
    
    if (whitelistInput) whitelistInput.classList.remove('hidden');
  }
  updateSummary();
}

function togglePerm(btn, perm, defaultVal) {
  rdoConfig[perm] = !rdoConfig[perm];
  
  const innerDot = btn.querySelector('div');
  
  if (rdoConfig[perm]) {
    // ON state
    btn.classList.add('bg-primary');
    btn.classList.remove('bg-surface-container-highest');
    btn.dataset.state = 'on';
    
    if (innerDot) {
      innerDot.classList.add('ml-auto', 'bg-white');
      innerDot.classList.remove('bg-outline');
    }
  } else {
    // OFF state
    btn.classList.add('bg-surface-container-highest');
    btn.classList.remove('bg-primary');
    btn.dataset.state = 'off';
    
    if (innerDot) {
      innerDot.classList.remove('ml-auto', 'bg-white');
      innerDot.classList.add('bg-outline');
    }
  }
  updateSummary();
}

// ── Step Execution ────────────────────────────────────────
async function runStep(step) {
  try {
    if (step === 'encrypt') {
      const textContent = document.getElementById('text-content').value;
      if (!textContent.trim() && !selectedFile) {
        if(typeof showToast === 'function') showToast('Please provide text or attach a file.', 'error');
        else alert('Please provide text or attach a file.');
        return;
      }

      document.getElementById('step-encrypt').classList.add('pointer-events-none');
      const statusEl = document.getElementById('step-encrypt').querySelector('.status-indicator') || document.createElement('div');
      statusEl.innerHTML = '<span class="text-xs text-primary animate-pulse w-full text-right block">Encrypting...</span>';
      if(!statusEl.parentNode) document.getElementById('step-encrypt').appendChild(statusEl);

      // 1. Pack the content into a combined JSON representation
      let fileData = null;
      if (selectedFile) {
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(selectedFile);
        });
      }

      const combinedPayload = JSON.stringify({
        text: textContent,
        file: fileData,
        fileName: selectedFile ? selectedFile.name : null,
        mimeType: selectedFile ? selectedFile.type : 'text/plain',
        meta: {
          isPaid: rdoConfig.isPaid,
          pricePerAccessEth: rdoConfig.isPaid ? rdoConfig.pricePerAccessEth : '0'
        }
      });

      // 2. Encrypt it using crypto.js
      const packaged = await packageForIPFS(combinedPayload, "rdo-bundle.json", "application/json");
      rdoState.encryptedPayload = packaged.payload; // JSON string payload
      rdoState.exportedKey = packaged.key;

      statusEl.innerHTML = '<span class="text-xs text-[#00E5FF] w-full text-right block font-bold">Done ✓</span>';
      
      const ipfsBtn = document.getElementById('step-ipfs');
      ipfsBtn.disabled = false;
      ipfsBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } 
    else if (step === 'ipfs') {
      document.getElementById('step-ipfs').classList.add('pointer-events-none');
      const statusEl = document.getElementById('step-ipfs').querySelector('.status-indicator') || document.createElement('div');
      statusEl.innerHTML = '<span class="text-xs text-primary animate-pulse w-full text-right block">Uploading to IPFS...</span>';
      if(!statusEl.parentNode) document.getElementById('step-ipfs').appendChild(statusEl);

      // Upload the JSON string directly as a file (supports large file uploads)
      const cid = await uploadToIPFS(rdoState.encryptedPayload, "rdo-encrypted.json");
      rdoState.ipfsCid = cid;

      statusEl.innerHTML = '<span class="text-xs text-[#00E5FF] w-full text-right block font-bold">Done ✓</span>';
      
      const mintBtn = document.getElementById('step-mint');
      mintBtn.disabled = false;
      mintBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
    else if (step === 'mint') {
      document.getElementById('step-mint').classList.add('pointer-events-none');
      const statusEl = document.getElementById('step-mint').querySelector('.status-indicator') || document.createElement('div');
      statusEl.innerHTML = '<span class="text-xs text-primary animate-pulse w-full text-right block">Confirming Transaction...</span>';
      if(!statusEl.parentNode) document.getElementById('step-mint').appendChild(statusEl);

      if (!window.walletState.address) {
        if(typeof connectWallet === 'function') await connectWallet();
        if (!window.walletState.address) throw new Error("Wallet not connected");
      }

      if (rdoConfig.isPaid && !validatePricePerAccess()) {
        throw new Error('Price per access must be greater than 0 ETH.');
      }

      const isWhitelist = rdoConfig.accessType === 'whitelist';
      const rawAdds = document.getElementById('whitelist-addresses').value || "";

      // Construct encrypted key arrays using our abstraction
      const payloadGeneration = await generateRDOKeyPayload(
        window.walletState.address, 
        rdoState.exportedKey, 
        isWhitelist, 
        rawAdds
      );
      
      // Contract call using struct matching params
      const paramsObj = {
        ipfsCid: rdoState.ipfsCid,
        accessType: isWhitelist ? 1 : 0,
        allowRead: rdoConfig.allowRead,
        allowCopy: rdoConfig.allowCopy,
        allowDownload: rdoConfig.allowDownload,
        maxOpens: rdoConfig.maxOpens,
        lockOnViolation: rdoConfig.lockOnViolation,
        isPaid: rdoConfig.isPaid,
        pricePerAccess: rdoConfig.isPaid ? ethers.parseEther(rdoConfig.pricePerAccessEth).toString() : '0',
        initialWhitelist: payloadGeneration.parsedWhitelist,
        encryptedKeys: payloadGeneration.encryptedKeysArray,
        creatorEncryptedKey: payloadGeneration.creatorEncryptedKey
      };

      const tx = await createRDO(paramsObj);

      statusEl.innerHTML = '<span class="text-xs text-[#00E5FF] w-full text-right block font-bold">Done ✓</span>';
      if(typeof showToast === 'function') showToast('RDO Created Successfully!', 'success');
      
      document.getElementById('step-mint').classList.add('hidden');
      document.getElementById('step-encrypt').classList.add('hidden');
      document.getElementById('step-ipfs').classList.add('hidden');
      
      const successCard = document.getElementById('success-card');
      if (successCard) {
        successCard.classList.remove('hidden');
        document.getElementById('rdo-id-display').innerText = tx.rdoId || 'Pending...';
        
        const txLink = document.getElementById('tx-link');
        if (txLink && tx.txHash) {
           txLink.innerText = tx.txHash.slice(0,10) + '...' + tx.txHash.slice(-8);
           txLink.href = `https://sepolia.etherscan.io/tx/${tx.txHash}`;
        }
        
        const viewLink = successCard.querySelector('a[href*="view.html"]');
        if (viewLink && tx.rdoId) {
           viewLink.href = `view.html?id=${tx.rdoId}`;
        }

        const publicHash = (!isWhitelist && rdoState.exportedKey) ? `#${encodeURIComponent(rdoState.exportedKey)}` : '';
        let baseViewPath = window.location.pathname.replace('create.html', 'view.html');
        if (baseViewPath === '/create') baseViewPath = '/view'; // Clean URL fallback
        const shareLink = `${window.location.origin}${baseViewPath}?id=${encodeURIComponent(tx.rdoId || '')}${publicHash}`;
        
        const shareDisplay = document.getElementById('share-link-display');
        const openShareLink = document.getElementById('open-share-link');
        if (shareDisplay) shareDisplay.innerText = shareLink;
        if (openShareLink) openShareLink.href = shareLink;

        const keyDisplay = document.getElementById('decryption-key-display');
        if (keyDisplay) {
           keyDisplay.parentElement.innerHTML = '<span class="text-[10px] text-green-400 font-bold uppercase tracking-widest block mb-2">Decryption Keys Delivered Automatically via On-Chain PKI</span><div class="text-xs text-on-surface-variant font-mono break-all opacity-70">No strings to copy. The contract has securely routed your AES decryption key directly into the authorized wallets.</div>';
        }
      } else {
        setTimeout(() => {
          window.location.href = `view.html?id=${tx.rdoId}`;
        }, 2000);
      }
    }
  } catch(err) {
    console.error(err);
    if(typeof showToast === 'function') showToast('Error: ' + err.message, 'error');
    else alert('Error: ' + err.message);
    
    // Reset loading state for the current step
    document.getElementById('step-' + step).classList.remove('pointer-events-none');
    const statusEl = document.getElementById('step-' + step).querySelector('.status-indicator');
    if(statusEl) statusEl.innerHTML = '<span class="text-error text-xs">Failed</span>';
  }
}
