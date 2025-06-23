import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FavoriteColorProgram } from "../target/types/favorite_color_program";

async function readUserColor(userPublicKey: string) {
  // Validate the user public key
  if (!userPublicKey) {
    console.error("❌ Please provide a user public key as an argument");
    process.exit(1);
  }

  // Validate that it's a valid Solana public key
  let targetUser: anchor.web3.PublicKey;
  try {
    targetUser = new anchor.web3.PublicKey(userPublicKey);
  } catch (error) {
    console.error("❌ Error: Invalid public key format");
    console.log("💡 Make sure you're using a valid Solana public key");
    process.exit(1);
  }

  console.log("🔍 Reading user color...");
  console.log("👤 Checking color for user:", targetUser.toString());

  // Connect to devnet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com"
  );

  // Create a dummy provider for reading (we don't need to sign anything)
  const dummyKeypair = anchor.web3.Keypair.generate();
  const dummyWallet = new anchor.Wallet(dummyKeypair);
  const provider = new anchor.AnchorProvider(connection, dummyWallet, {});
  anchor.setProvider(provider);

  // Load the program
  const program = anchor.workspace
    .FavoriteColorProgram as Program<FavoriteColorProgram>;

  console.log("📋 Program ID:", program.programId.toString());

  // Find the storage address for this user
  const [userColorPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user-color"), targetUser.toBuffer()],
    program.programId
  );

  console.log("🏠 Storage address:", userColorPDA.toString());

  try {
    // Fetch the stored data
    const account = await program.account.userColor.fetch(userColorPDA);

    console.log("\n✅ Found favorite color!");
    console.log("🌈 Color:", account.color);
    console.log("👤 Owner:", account.user.toString());

    console.log("\n🔍 View on Solana Explorer:");
    console.log(
      `https://explorer.solana.com/address/${userColorPDA.toString()}?cluster=devnet`
    );
  } catch (error) {
    console.log("\n❌ No favorite color found for this user");
    console.log("💡 This user hasn't set a favorite color yet");

    // Optionally show the error details for debugging
    if (error.message.includes("Account does not exist")) {
      console.log("🔍 Account doesn't exist at this address");
    } else {
      console.log("🐛 Error details:", error.message);
    }
  }
}

// Run with environment variables for devnet
process.env.ANCHOR_PROVIDER_URL = "https://api.devnet.solana.com";

const userToCheck = process.argv[2];
readUserColor(userToCheck).catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
