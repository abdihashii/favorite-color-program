import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FavoriteColorProgram } from "../target/types/favorite_color_program";
import * as fs from "fs";

async function main(payerKeypair: anchor.web3.Keypair, newColor: string) {
  console.log("🚀 Starting client...");

  // Connect to devnet
  const connection = new anchor.web3.Connection(
    "https://api.devnet.solana.com"
  );

  // Load your wallet
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(payerKeypair),
    {}
  );
  anchor.setProvider(provider);

  // Load your program
  const program = anchor.workspace
    .FavoriteColorProgram as Program<FavoriteColorProgram>;

  console.log("📋 Program ID:", program.programId.toString());
  console.log("👤 User:", provider.wallet.publicKey.toString());

  // Find your personal storage address
  const [userColorPDA] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("user-color"), provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  console.log("🏠 Your storage address:", userColorPDA.toString());

  try {
    // Try to fetch existing data first
    let accountExists = false;
    try {
      const existingAccount = await program.account.userColor.fetch(
        userColorPDA
      );
      console.log("✅ Found existing color:", existingAccount.color);
      accountExists = true;
    } catch (error) {
      console.log("❌ No existing color found");
    }

    if (!accountExists) {
      console.log(`🎨 Setting your favorite color to '${newColor}'...`);

      const tx = await program.methods
        .initialize(newColor)
        .accounts({
          userColor: userColorPDA,
          user: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      console.log("📝 Transaction signature:", tx);
      console.log("🎉 Successfully stored your favorite color");
    } else {
      // Update existing color
      console.log(`🎨 Updating your favorite color to '${newColor}'...`);

      const tx = await program.methods
        .updateColor(newColor)
        .accounts({
          userColor: userColorPDA,
          user: provider.wallet.publicKey,
        })
        .rpc();

      console.log("📝 Transaction signature:", tx);
      console.log("🎉 Successfully updated your favorite color");
    }

    // Fetch and display the final result
    const account = await program.account.userColor.fetch(userColorPDA);
    console.log("🌈 Your current favorite color is:", account.color);

    // Show the blockchain explorer link
    console.log("🔍 View on Solana Explorer:");
    console.log(
      `https://explorer.solana.com/address/${userColorPDA.toString()}?cluster=devnet`
    );
  } catch (error) {
    console.error("❌ Error storing color:", error);
  }
}

// Parse and validate command line arguments
function parseArguments() {
  const keypairPath = process.argv[2];
  const color = process.argv[3];

  // Validation
  if (!keypairPath || !color) {
    console.log("❌ Missing required arguments");
    console.log(
      "📖 Usage: npx ts-node set-color.ts <KEYPAIR_FILE_PATH> <COLOR>"
    );
    console.log("💡 Examples:");
    console.log(
      "   npx ts-node set-color.ts ~/.config/solana/A1.json 'ocean blue'"
    );
    console.log("   npx ts-node set-color.ts ./my-wallet.json red");
    process.exit(1);
  }

  // Check if keypair file exists
  if (!fs.existsSync(keypairPath)) {
    console.log(`❌ Keypair file not found: ${keypairPath}`);
    process.exit(1);
  }

  // Load the keypair
  let payerKeypair: anchor.web3.Keypair;
  try {
    const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf8"));
    payerKeypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(secretKey));
  } catch (error) {
    console.log(`❌ Error loading keypair from ${keypairPath}:`, error.message);
    process.exit(1);
  }

  // Validate color length
  if (color.length > 50) {
    console.log("❌ Color name too long (max 50 characters)");
    process.exit(1);
  }

  return { payerKeypair, color };
}

const { payerKeypair, color } = parseArguments();
main(payerKeypair, color).catch(console.error);
