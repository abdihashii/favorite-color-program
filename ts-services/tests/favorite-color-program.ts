import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { FavoriteColorProgram } from "../../rust-services/target/types/favorite_color_program";

describe("favorite-color-program", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace
    .favoriteColorProgram as Program<FavoriteColorProgram>;
  const user = provider.wallet;

  it("Can store a favorite color", async () => {
    const color = "orange";

    // Find the program address for this user (like generating a unique storage key)
    const [userColorPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-color"), user.publicKey.toBuffer()],
      program.programId
    );

    // Call our initialize function
    await program.methods
      .initialize(color)
      .accounts({
        userColor: userColorPDA,
        user: user.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Fetch the account data and verify it's stored correctly
    const userColorAccount = await program.account.userColor.fetch(
      userColorPDA
    );
    expect(userColorAccount.color).to.equal(color);
    expect(userColorAccount.user.toString()).to.equal(
      user.publicKey.toString()
    );
  });

  it("Can update favorite color", async () => {
    const newColor = "red";

    const [userColorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user-color"), user.publicKey.toBuffer()],
      program.programId
    );

    // Update the color
    await program.methods
      .updateColor(newColor)
      .accounts({
        userColor: userColorPda,
        user: user.publicKey,
      })
      .rpc();

    // Verify the update
    const userColorAccount = await program.account.userColor.fetch(
      userColorPda
    );
    expect(userColorAccount.color).to.equal(newColor);
  });
});
