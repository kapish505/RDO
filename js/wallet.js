/* ============================================
   wallet.js - MetaMask / Wallet Connection
   ============================================ */

window.walletState = {
  address: null,
  signer: null,
  provider: null,
  chainId: null,
  isConnected: false
};

// Safe showToast wrapper - falls back to console if toast not available
function showToast(msg, type) {
  if (typeof window._showToast === 'function') return window._showToast(type, '', msg);
  console.log(`[${type}] ${msg}`);
}

// Target network - Sepolia testnet
const TARGET_CHAIN_ID = '0xaa36a7'; // Sepolia
const TARGET_CHAIN_NAME = 'Sepolia Testnet';

async function connectWallet() {
  if (!window.ethereum) {
    showToast('MetaMask not detected. Please install MetaMask.', 'error');
    return false;
  }

  try {
    showButtonLoading(document.querySelector('[data-action="connect-wallet"]'));

    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      showToast('No accounts found. Please unlock MetaMask.', 'error');
      return false;
    }

    await setupProvider();
    showToast(`Wallet connected: ${truncateAddress(walletState.address)}`, 'success');
    updateWalletUI();
    return true;

  } catch (error) {
    console.error('Wallet connection error:', error);
    if (error.code === 4001) {
      showToast('Connection rejected by user.', 'error');
    } else {
      showToast('Failed to connect wallet: ' + error.message, 'error');
    }
    return false;
  } finally {
    hideButtonLoading(document.querySelector('[data-action="connect-wallet"]'));
  }
}

async function setupProvider() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const network = await provider.getNetwork();

  walletState.provider = provider;
  walletState.signer = signer;
  walletState.address = address;
  walletState.chainId = '0x' + network.chainId.toString(16);
  walletState.isConnected = true;

  // Fire wallet:connected event for pages to listen to
  document.dispatchEvent(new CustomEvent('wallet:connected', {
    detail: { address, provider, signer, chainId: walletState.chainId }
  }));
}

async function checkAndSwitchNetwork() {
  if (!walletState.isConnected) return false;

  if (walletState.chainId !== TARGET_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: TARGET_CHAIN_ID }]
      });
      await setupProvider();
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: TARGET_CHAIN_ID,
              chainName: TARGET_CHAIN_NAME,
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          await setupProvider();
          return true;
        } catch (addError) {
          showToast('Failed to add network.', 'error');
          return false;
        }
      }
      showToast('Failed to switch network.', 'error');
      return false;
    }
  }
  return true;
}

function updateWalletUI() {
  const walletBtns = document.querySelectorAll('[data-action="connect-wallet"]');
  walletBtns.forEach(btn => {
    if (walletState.isConnected) {
      btn.innerHTML = `
        <span class="wallet-dot connected"></span>
        ${truncateAddress(walletState.address)}
      `;
      btn.classList.add('connected');
    } else {
      btn.innerHTML = `<span class="wallet-dot"></span> Connect Wallet`;
      btn.classList.remove('connected');
    }
  });

  // Dispatch custom event
  document.dispatchEvent(new CustomEvent('walletStateChanged', {
    detail: walletState
  }));
}

async function autoConnectWallet() {
  if (!window.ethereum) return;

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });

    if (accounts && accounts.length > 0) {
      await setupProvider();
      updateWalletUI();
    }
  } catch (error) {
    console.error('Auto-connect error:', error);
  }
}

function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function showButtonLoading(btn) {
  if (!btn) return;
  btn._originalContent = btn.innerHTML;
  btn.innerHTML = `<div class="spinner"></div> Connecting...`;
  btn.classList.add('btn-loading');
}

function hideButtonLoading(btn) {
  if (!btn) return;
  if (btn._originalContent) {
    btn.innerHTML = btn._originalContent;
  }
  btn.classList.remove('btn-loading');
}

// Listen for account changes
if (window.ethereum) {
  window.ethereum.on('accountsChanged', async (accounts) => {
    if (accounts.length === 0) {
      walletState.isConnected = false;
      walletState.address = null;
      walletState.signer = null;
      updateWalletUI();
      showToast('Wallet disconnected.', 'info');
    } else {
      await setupProvider();
      updateWalletUI();
      showToast(`Switched to ${truncateAddress(walletState.address)}`, 'info');
    }
  });

  window.ethereum.on('chainChanged', async () => {
    await setupProvider();
    updateWalletUI();
    showToast('Network changed.', 'info');
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Attach click handlers to all wallet buttons
  document.querySelectorAll('[data-action="connect-wallet"]').forEach(btn => {
    btn.addEventListener('click', connectWallet);
  });

  // Auto-connect if previously connected
  autoConnectWallet();
});
