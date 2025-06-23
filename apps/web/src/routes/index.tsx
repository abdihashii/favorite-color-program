import { createFileRoute } from "@tanstack/react-router";
import ConnectButton from "@/components/ConnectButton";
import { useAppKitWallet } from "@/hooks/use-appkit-wallet";
import { useColor } from "@/hooks/use-color";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { address, status } = useAppKitWallet();
  const {
    // State
    userColor,
    isLoading,
    newFavoriteColor,
    setNewFavoriteColor,

    // Methods
    handleSetUserColor,
  } = useColor(address ?? "");

  return (
    <div>
      <ConnectButton />

      {status === "connected" && (
        <div>
          <p>Favorite color: {userColor ?? "No color set"}</p>
          <div>
            <p>Address: {address}</p>
            <p>Status: {status}</p>
          </div>

          <form
            onSubmit={handleSetUserColor}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              border: "1px solid #ccc",
              padding: "1rem",
              borderRadius: "0.5rem",
              width: "300px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <label htmlFor="color">New favorite color</label>
              <input
                type="text"
                name="color"
                id="color"
                placeholder="Enter new favorite color"
                required
                disabled={isLoading}
                value={newFavoriteColor}
                onChange={(e) => setNewFavoriteColor(e.target.value)}
              />
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Setting color..." : "Submit"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
