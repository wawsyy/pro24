"use client";

import type { ReactNode } from "react";

import { RainbowProvider } from "@/hooks/rainbow/useRainbowProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { RainbowEthersSignerProvider } from "@/hooks/rainbow/useRainbowEthersSigner";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return (
    <RainbowProvider>
      <RainbowEthersSignerProvider initialMockChains={{ 31337: "http://localhost:8545" }}>
        <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
      </RainbowEthersSignerProvider>
    </RainbowProvider>
  );
}
