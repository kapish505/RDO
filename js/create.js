let selectedFile = null;

let rdoConfig = {
  maxOpens: 10,
  accessType: 'whitelist', // default
  allowRead: true,
  allowCopy: false,
  allowDownload: false,
  lockOnViolation: true
};

let rdoState = {
  encryptedPayload: null,
  exportedKey: null,
  ipfsCid: null
};

document.addEventListener('DOMContentLoaded', () => {
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
  rdoConfig.maxOpens = val;
  const valEl = document.getElementById('max-opens-display');
  if (valEl) {
    valEl.innerText = val == 0 ? 'Unlimited' : val;
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
  
  setStatus('s-reads', rdoConfig.allowRead);
  setStatus('s-copy', rdoConfig.allowCopy);
  setStatus('s-download', rdoConfig.allowDownload);
  
  document.getElementById('s-max').innerText = rdoConfig.maxOpens == 0 ? 'Unlimited' : rdoConfig.maxOpens;
  
  const lockEl = document.getElementById('s-lock');
  if (lockEl) {
    lockEl.innerText = rdoConfig.lockOnViolation ? 'Enabled' : 'Disabled';
    lockEl.className = rdoConfig.lockOnViolation ? 'text-sm font-medium text-emerald-400' : 'text-sm font-medium text-secondary';
  }
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
        mimeType: selectedFile ? selectedFile.type : 'text/plain'
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

      // Upload the JSON string as an IPFS JSON object
      const parsedPayload = JSON.parse(rdoState.encryptedPayload);
      const cid = await uploadJSONToIPFS(parsedPayload, "rdo-encrypted.json");
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

      if (!window.walletAddress) {
        if(typeof connectWallet === 'function') await connectWallet();
        if (!window.walletAddress) throw new Error("Wallet not connected");
      }

      const isWhitelist = rdoConfig.accessType === 'whitelist';
      
      // Parse whitelist addresses
      let parsedWhitelist = [];
      if (isWhitelist) {
        const rawAdds = document.getElementById('whitelist-addresses').value;
        if (rawAdds) {
          parsedWhitelist = rawAdds.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
      }
      
      // Contract call using params object
      const paramsObj = {
        ipfsCid: rdoState.ipfsCid,
        accessType: isWhitelist ? 1 : 0,
        allowRead: rdoConfig.allowRead,
        allowCopy: rdoConfig.allowCopy,
        allowDownload: rdoConfig.allowDownload,
        maxOpens: rdoConfig.maxOpens,
        lockOnViolation: rdoConfig.lockOnViolation,
        whitelist: parsedWhitelist
      };

      const tx = await createRDO(paramsObj);

      statusEl.innerHTML = '<span class="text-xs text-[#00E5FF] w-full text-right block font-bold">Done ✓</span>';
      if(typeof showToast === 'function') showToast('RDO Created Successfully!', 'success');
      
      // Redirect to view
      setTimeout(() => {
        window.location.href = `view.html?id=${rdoState.ipfsCid}&key=${encodeURIComponent(rdoState.exportedKey)}`;
      }, 2000);
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
