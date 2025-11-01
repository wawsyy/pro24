"use client";

import { useState } from "react";
import { useRainbow } from "@/hooks/rainbow/useRainbowProvider";

type SupportedNetwork = "hardhat" | "sepolia";

const NETWORKS: Record<
  SupportedNetwork,
  {
    label: string;
    chainId: number;
    chainIdHex: `0x${string}`;
    rpcUrls: string[];
    blockExplorerUrls: string[];
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
  }
> = {
  hardhat: {
    label: "Hardhat Local",
    chainId: 31337,
    chainIdHex: "0x7a69",
    rpcUrls: ["http://127.0.0.1:8545"],
    blockExplorerUrls: [],
    nativeCurrency: {
      name: "Hardhat ETH",
      symbol: "ETH",
      decimals: 18,
    },
  },
  sepolia: {
    label: "Sepolia Testnet",
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
    nativeCurrency: {
      name: "Sepolia ETH",
      symbol: "SEP",
      decimals: 18,
    },
  },
};

export function NetworkToggle() {
  const { provider, chainId, isConnected } = useRainbow();
  const [status, setStatus] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (target: SupportedNetwork) => {
    if (!provider) {
      setStatus("Wallet provider not detected");
      return;
    }
    setIsSwitching(true);
    setStatus(null);

    const targetNetwork = NETWORKS[target];
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetNetwork.chainIdHex }],
      });
      setStatus(`Switched to ${targetNetwork.label}`);
    } catch (err: unknown) {
      const error = err as { code?: number; message?: string };
      if (error?.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: targetNetwork.chainIdHex,
                chainName: targetNetwork.label,
                nativeCurrency: targetNetwork.nativeCurrency,
                rpcUrls: targetNetwork.rpcUrls,
                blockExplorerUrls: targetNetwork.blockExplorerUrls,
              },
            ],
          });
          setStatus(`Added ${targetNetwork.label}, please approve switch`);
        } catch (addError: unknown) {
          const addErr = addError as { message?: string };
          setStatus(addErr?.message ?? "Failed to add chain");
        }
      } else {
        setStatus(error?.message ?? "Failed to switch network");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex gap-2 rounded-xl bg-white/60 border border-white/50 p-1 shadow-sm">
        {(Object.keys(NETWORKS) as SupportedNetwork[]).map((key) => {
          const active = chainId === NETWORKS[key].chainId;
          return (
            <button
              key={key}
              onClick={() => handleSwitch(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  : "bg-transparent text-purple-600 hover:bg-purple-50"
              }`}
              disabled={!provider || !isConnected || isSwitching || active}
            >
              {NETWORKS[key].label}
            </button>
          );
        })}
      </div>
      {status && (
        <span className="text-xs text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1">
          {status}
        </span>
      )}
    </div>
  );
}

