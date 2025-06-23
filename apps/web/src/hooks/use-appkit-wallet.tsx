import { Provider } from "@reown/appkit-adapter-solana/react";
import {
  // useAppKit,
  useAppKitAccount,
  useAppKitProvider,
  // useDisconnect,
} from "@reown/appkit/react";
// import { useSolanaConnection } from "@/hooks/use-solana-connection";

export function useAppKitWallet() {
  // const { connection } = useSolanaConnection();
  const { address, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider<Provider>("solana");

  return {
    address,
    status,
    walletProvider,
  };
}
