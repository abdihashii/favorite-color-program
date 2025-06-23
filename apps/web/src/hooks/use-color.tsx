import { useAppKitWallet } from "@/hooks/use-appkit-wallet";
import { useSolanaConnection } from "@/hooks/use-solana-connection";
import { FAVORITE_COLOR_PROGRAM_ID } from "@/lib/constants";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useEffect, useState } from "react";

export function useColor(userPublicKey: string) {
  const [userColor, setUserColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newFavoriteColor, setNewFavoriteColor] = useState<string>("");

  const { connection } = useSolanaConnection();
  const { walletProvider } = useAppKitWallet();

  async function getUserColorOnChain(): Promise<string | null> {
    if (!userPublicKey) {
      console.error("❌ Please provide a user public key as an argument");
      return null;
    }

    if (!FAVORITE_COLOR_PROGRAM_ID) {
      console.error("❌ Program ID not configured");
      return null;
    }

    try {
      // Parse the user public key
      const userPubkey = new PublicKey(userPublicKey);
      const programId = new PublicKey(FAVORITE_COLOR_PROGRAM_ID);

      // Calculate the PDA for this user's color account
      const [userColorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-color"), userPubkey.toBuffer()],
        programId
      );

      // Fetch the account data
      const accountInfo = await connection.getAccountInfo(userColorPDA);

      if (!accountInfo || !accountInfo.data) {
        return null; // Account doesn't exist
      }

      // Deserialize the account data
      // Account structure: 8-byte discriminator + 32-byte pubkey + string
      const data = accountInfo.data;

      // Skip the 8-byte discriminator
      let offset = 8;

      // Skip the user pubkey (32 bytes)
      offset += 32;

      // Read the color string (4-byte length prefix + string data)
      const colorLength = data.readUInt32LE(offset);
      offset += 4;
      const colorBytes = new Uint8Array(
        data.subarray(offset, offset + colorLength)
      );
      const color = new TextDecoder().decode(colorBytes);

      return color;
    } catch (error) {
      console.error("Error fetching user color:", error);
      return null;
    }
  }

  async function setUserColorOnChain(color: string): Promise<boolean> {
    if (!userPublicKey || !walletProvider || !FAVORITE_COLOR_PROGRAM_ID) {
      console.error("❌ Wallet not connected or program ID missing");
      return false;
    }

    setIsLoading(true);

    try {
      const userPubkey = new PublicKey(userPublicKey);
      const programId = new PublicKey(FAVORITE_COLOR_PROGRAM_ID);

      console.log("🔍 Checking account status...");

      // Calculate the PDA for this user's color account
      const [userColorPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("user-color"), userPubkey.toBuffer()],
        programId
      );

      // Check if account already exists
      const accountInfo = await connection.getAccountInfo(userColorPDA);
      const accountExists = accountInfo !== null;

      console.log(`📦 Account ${accountExists ? "exists" : "will be created"}`);

      // Get latest blockhash with confirmed commitment
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      // Build transaction instructions
      const instructions: TransactionInstruction[] = [];

      // Add compute budget instructions for optimization
      instructions.push(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: accountExists ? 200_000 : 400_000, // More units for account creation
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 1000, // Basic priority fee
        })
      );

      // Add the main program instruction
      if (!accountExists) {
        // Initialize instruction - create new account
        const colorBytes = Buffer.from(color, "utf-8");
        const colorData = Buffer.alloc(4 + colorBytes.length);
        colorData.writeUInt32LE(colorBytes.length, 0);
        colorBytes.copy(colorData, 4);

        const instructionData = Buffer.concat([
          Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]), // Initialize discriminator
          colorData,
        ]);

        instructions.push(
          new TransactionInstruction({
            keys: [
              { pubkey: userColorPDA, isSigner: false, isWritable: true },
              { pubkey: userPubkey, isSigner: true, isWritable: true },
              {
                pubkey: SystemProgram.programId,
                isSigner: false,
                isWritable: false,
              },
            ],
            programId,
            data: instructionData,
          })
        );
      } else {
        // Update instruction - modify existing account
        const colorBytes = Buffer.from(color, "utf-8");
        const colorData = Buffer.alloc(4 + colorBytes.length);
        colorData.writeUInt32LE(colorBytes.length, 0);
        colorBytes.copy(colorData, 4);

        const instructionData = Buffer.concat([
          Buffer.from([241, 180, 54, 166, 175, 158, 88, 131]), // UpdateColor discriminator
          colorData,
        ]);

        instructions.push(
          new TransactionInstruction({
            keys: [
              { pubkey: userColorPDA, isSigner: false, isWritable: true },
              { pubkey: userPubkey, isSigner: true, isWritable: true },
            ],
            programId,
            data: instructionData,
          })
        );
      }

      // Create versioned transaction message
      const messageV0 = new TransactionMessage({
        payerKey: userPubkey,
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      console.log("🧪 Simulating transaction...");

      // Simulate transaction first
      const simulationResult = await connection.simulateTransaction(
        transaction,
        {
          commitment: "confirmed",
        }
      );

      if (simulationResult.value.err) {
        throw new Error(
          `Transaction simulation failed: ${JSON.stringify(
            simulationResult.value.err
          )}`
        );
      }

      console.log(
        `⚡ Simulation successful. Compute units used: ${simulationResult.value.unitsConsumed}`
      );

      // Send transaction via AppKit (it will handle signing)
      console.log("📤 Sending transaction...");
      const signature = await (walletProvider as any).signAndSendTransaction(
        transaction
      );

      console.log("⏳ Confirming transaction...", signature);

      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed"
      );

      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      console.log("✅ Transaction confirmed:", signature);
      return true;
    } catch (error) {
      console.error("❌ Error setting color:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handle the form submission to set the user's favorite color
   * @param e - The form event
   * @returns void
   */
  const handleSetUserColor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const color = formData.get("color") as string;

    if (!color) return;

    console.log("Setting color on chain:", color);

    // Send transaction to blockchain
    const success = await setUserColorOnChain(color);

    if (success && userPublicKey) {
      // Invalidate the user's color from the blockchain
      const updatedColor = await getUserColorOnChain();
      setUserColor(updatedColor);

      // Reset the form
      setNewFavoriteColor("");
    }
  };

  // Get user color whenever the connected address changes
  useEffect(() => {
    if (userPublicKey) {
      getUserColorOnChain().then((color) => {
        setUserColor(color);
      });
    }
  }, [userPublicKey]);

  return {
    // State
    userColor,
    setUserColor,
    isLoading,
    newFavoriteColor,
    setNewFavoriteColor,

    // Methods
    getUserColorOnChain,
    handleSetUserColor,
  };
}
