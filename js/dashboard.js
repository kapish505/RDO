let myRDOs = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (window.ethereum) {
    await connectWallet(false);
    if (window.walletState.address) {
      await loadMyRDOs();
    }
  }
});

// Re-run after wallet connects
window.addEventListener('walletConnected', async () => {
  await loadMyRDOs();
});

async function loadMyRDOs() {
  const grid = document.getElementById('rdo-grid');
  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');

  loadingState.classList.remove('hidden');
  grid.innerHTML = '';
  emptyState.classList.add('hidden');

  try {
    const ids = await getMyRDOIds();
    if (ids.length === 0) {
      loadingState.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    myRDOs = [];
    
    // Fetch details for each ID the user has created
    for (const i of ids) {
      try {
        const rdo = await getRDO(i);
        // Safety check, though the event filter already checked creator
        if (rdo.creator.toLowerCase() === window.walletState.address.toLowerCase()) {
          myRDOs.push({ ...rdo, numericId: i });
        }
      } catch { /* skip missing ones */ }
    }

    loadingState.classList.add('hidden');

    if (myRDOs.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      myRDOs.forEach(rdo => grid.appendChild(buildCard(rdo)));
    }
  } catch (err) {
    loadingState.classList.add('hidden');
    if (typeof showToast === 'function') showToast('Failed to load RDOs: ' + err.message, 'error');
  }
}

function buildCard(rdo) {
  const status = getRDOStatus(rdo);
  const statusColor = {
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    error: 'text-error bg-error/10 border-error/20',
    neutral: 'text-secondary bg-secondary/10 border-secondary/20'
  }[status.type];

  const accessLabel = rdo.isWhitelist ? 'Whitelist' : 'Public';
  const maxOpensLabel = rdo.maxOpens === 0 ? '∞' : rdo.maxOpens;

  const card = document.createElement('div');
  card.className = 'bg-surface-container-low border border-[#474750]/20 rounded-lg overflow-hidden hover:border-primary/20 transition-all group';
  card.innerHTML = `
    <div class="p-5">
      <div class="flex justify-between items-start mb-4">
        <div>
          <div class="text-[10px] font-bold tracking-widest text-secondary uppercase mb-1 font-label">RDO #${rdo.numericId}</div>
          <h3 class="text-base font-mono text-on-surface truncate max-w-[180px]">${rdo.ipfsCid.slice(0,10)}...${rdo.ipfsCid.slice(-8)}</h3>
        </div>
        <span class="px-2.5 py-1 border rounded-full text-[9px] font-bold tracking-widest uppercase ${statusColor}">${status.label}</span>
      </div>

      <div class="grid grid-cols-2 gap-2 mb-4 text-[11px]">
        <div class="bg-surface-container p-2.5 rounded">
          <div class="text-outline uppercase tracking-wider mb-0.5">Access</div>
          <div class="text-on-surface font-medium">${accessLabel}</div>
        </div>
        <div class="bg-surface-container p-2.5 rounded">
          <div class="text-outline uppercase tracking-wider mb-0.5">Opens</div>
          <div class="text-on-surface font-medium">${rdo.openCount} / ${maxOpensLabel}</div>
        </div>
        <div class="bg-surface-container p-2.5 rounded">
          <div class="text-outline uppercase tracking-wider mb-0.5">Copy</div>
          <div class="${rdo.allowCopy ? 'text-primary' : 'text-secondary'} font-medium">${rdo.allowCopy ? 'Allowed' : 'Denied'}</div>
        </div>
        <div class="bg-surface-container p-2.5 rounded">
          <div class="text-outline uppercase tracking-wider mb-0.5">Download</div>
          <div class="${rdo.allowDownload ? 'text-primary' : 'text-secondary'} font-medium">${rdo.allowDownload ? 'Allowed' : 'Denied'}</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 flex-wrap">
        <a href="view.html?id=${rdo.numericId}" class="flex-1 text-center py-2 bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase rounded hover:bg-primary/20 transition-all">
          View
        </a>
        ${!rdo.isRevoked ? `
        <button onclick="revokeRDOAction(${rdo.numericId}, this)" class="flex-1 py-2 bg-error/10 border border-error/20 text-error text-[10px] font-bold tracking-widest uppercase rounded hover:bg-error/20 transition-all">
          Revoke
        </button>` : ''}
        ${rdo.isLocked && !rdo.isRevoked ? `
        <button onclick="unlockRDOAction(${rdo.numericId}, this)" class="flex-1 py-2 bg-surface-container border border-[#474750]/20 text-on-surface text-[10px] font-bold tracking-widest uppercase rounded hover:border-primary/30 transition-all">
          Unlock
        </button>` : ''}
      </div>

      <!-- Transfer Coming Soon -->
      <div class="mt-3 flex items-center gap-2 p-2.5 rounded border border-dashed border-[#474750]/30 bg-surface-container/50">
        <span class="material-symbols-outlined text-sm text-secondary">swap_horiz</span>
        <span class="text-[10px] text-secondary flex-1">Transfer Ownership</span>
        <span class="px-2 py-0.5 bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[9px] font-bold tracking-widest uppercase rounded-full">V2</span>
      </div>
    </div>
  `;
  return card;
}

async function revokeRDOAction(rdoId, btn) {
  btn.disabled = true;
  btn.innerText = 'Revoking...';
  try {
    await revokeRDO(rdoId);
    if (typeof showToast === 'function') showToast(`RDO #${rdoId} revoked.`, 'success');
    setTimeout(loadMyRDOs, 2000);
  } catch (e) {
    btn.disabled = false;
    btn.innerText = 'Revoke';
    if (typeof showToast === 'function') showToast(e.message, 'error');
  }
}

async function unlockRDOAction(rdoId, btn) {
  btn.disabled = true;
  btn.innerText = 'Unlocking...';
  try {
    await unlockRDO(rdoId);
    if (typeof showToast === 'function') showToast(`RDO #${rdoId} unlocked.`, 'success');
    setTimeout(loadMyRDOs, 2000);
  } catch (e) {
    btn.disabled = false;
    btn.innerText = 'Unlock';
    if (typeof showToast === 'function') showToast(e.message, 'error');
  }
}
