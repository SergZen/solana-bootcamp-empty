import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {TabsContent} from "@/components/ui/tabs";
import {Loader2} from "lucide-react";
import {WalletMultiButton} from "@solana/wallet-adapter-react-ui";
import {Button} from "@/components/ui/button";
import {useWallet, useConnection} from "@solana/wallet-adapter-react";
import {TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID} from '@solana/spl-token';
import {useEffect, useState} from "react";
import {TokenList} from "../components/TokenList";

interface TokenBalance {
  mint: string;
  amount: number;
}

export default function AccountTokens({
                                        isWalletConnected,
                                        disconnect,
                                        setIsWalletConnected,
                                        loading,
                                      }: {
  isWalletConnected: boolean;
  disconnect: () => void;
  setIsWalletConnected: (isWalletConnected: boolean) => void;
  loading: boolean;
}) {
  const {publicKey} = useWallet();
  const {connection} = useConnection();
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  useEffect(() => {
    async function fetchTokenAccounts() {
      if (!publicKey) return;

      setIsLoadingTokens(true);
      try {
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {programId: TOKEN_PROGRAM_ID}
        );

        const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {programId: TOKEN_2022_PROGRAM_ID}
        );

        const accounts = [...tokenAccounts.value, ...token2022Accounts.value];

        const allTokens = accounts.map((account) => {
          const parsedInfo = account.account.data.parsed.info;
          return {
            mint: parsedInfo.mint,
            amount: Number(parsedInfo.tokenAmount.amount)
          };
        });

        setTokens(allTokens);
      } catch (error) {
        console.error("Error fetching token accounts:", error);
      } finally {
        setIsLoadingTokens(false);
      }
    }

    if (isWalletConnected && publicKey) {
      fetchTokenAccounts();
    }
  }, [connection, publicKey, isWalletConnected]);

  return (
    <TabsContent value="accountTokens">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Your Tokens</CardTitle>
            <CardDescription>View your tokens.</CardDescription>
          </div>
          {isWalletConnected ? (
            <div>
              <Button
                onClick={() => {
                  try {
                    disconnect();
                    setIsWalletConnected(false);
                  } catch (e) {
                    console.log("Error disconnecting", e);
                  }
                }}
              >
                Disconnect
              </Button>
            </div>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isWalletConnected ? (
              <div className="text-center py-8">
                <p className="mb-4 text-muted-foreground">
                  Connect your wallet to view your tokens
                </p>
                <WalletMultiButton style={{backgroundColor: "black"}}>
                  <Button asChild disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        Connecting...
                      </>
                    ) : (
                      <div>Connect Wallet</div>
                    )}
                  </Button>
                </WalletMultiButton>
              </div>
            ) : (
              <>
                {isLoadingTokens ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mr-2"/>
                    <span>Loading your tokens...</span>
                  </div>
                ) : tokens.length > 0 ? (
                  <TokenList tokens={tokens}/>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No tokens found in your wallet
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
