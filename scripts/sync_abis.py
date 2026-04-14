#!/usr/bin/env python3
import json
import os
import sys

def main():
    print("🚀 Running Native ABI Sync Pipeline...")
    
    # Try Foundry mapping first
    foundry_path = "out/RDO.sol/RDO.json"
    hardhat_path = "artifacts/contracts/RDO.sol/RDO.json"
    
    target_path = None
    if os.path.exists(foundry_path):
        target_path = foundry_path
        print(f"✅ Discovered Foundry deployment mapping at {foundry_path}")
    elif os.path.exists(hardhat_path):
        target_path = hardhat_path
        print(f"✅ Discovered HardHat deployment mapping at {hardhat_path}")
    else:
        print("❌ CRITICAL: No local compilation artifacts found! Are you deploying via Remix?")
        print("💡 Hint: If using Remix, download your ABI manually and overwrite abi.json directly.")
        sys.exit(1)

    try:
        with open(target_path, 'r') as f:
            compiled_data = json.load(f)
            
        abi = compiled_data.get('abi')
        if not abi:
            print("❌ Invalid ABI structure inside compilation artifact.")
            sys.exit(1)
            
        with open("abi.json", "w") as f:
            json.dump(abi, f, indent=4)
        print("✅ Successfully locked abi.json structure to matching deployment requirements!")
        
    except Exception as e:
        print(f"❌ Structural sync failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
