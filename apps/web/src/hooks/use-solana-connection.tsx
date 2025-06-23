import { useMemo } from "react";
import { clusterApiUrl, Connection } from "@solana/web3.js";
import { SOLANA_RPC_ENDPOINT } from "@/lib/constants";

export function useSolanaConnection() {
  const endpoint = useMemo(() => {
    const isProduction = import.meta.env.VITE_ENV === "production";

    if (!SOLANA_RPC_ENDPOINT || !isProduction) {
      return clusterApiUrl("devnet");
    }

    return SOLANA_RPC_ENDPOINT;
  }, [SOLANA_RPC_ENDPOINT]);

  const connection = new Connection(endpoint, {
    commitment: "confirmed",
  });

  return { endpoint, connection };
}
