"use client";
import TransactionXRay from "@/components/transaction-xray";

import { useState } from "react";
import {
  decodeFunctionData,
  encodeFunctionData,
  parseAbi,
} from "viem";

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
};

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const TOKEN_ADDRESS =
  "0x0ed5e77b023eb522EB10313CA2dc6A3aB50f28b6";

const SPENDER =
  "0x000000000000000000000000000000000000dEaD";

const MAX_UINT256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");

const abi = parseAbi([
  "function approve(address spender, uint256 amount)",
]);

const calldata = encodeFunctionData({
  abi,
  functionName: "approve",
  args: [SPENDER, MAX_UINT256],
});

export default function DemoPage() {
  const [step, setStep] = useState<"start" | "request" | "analysis">(
    "start"
  );

  const [walletAddress, setWalletAddress] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [txHash, setTxHash] = useState("");

  async function connectWallet() {
    setWalletError("");

    if (!window.ethereum) {
      setWalletError("No browser wallet detected. Install Rabby or MetaMask.");
      return "";
    }

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const address = accounts[0] ?? "";

      setWalletAddress(address);

      return address;
    } catch {
      setWalletError("Wallet connection was cancelled.");
      return "";
    }
  }

  async function ensureBscTestnet() {
    if (!window.ethereum) return false;

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x61" }],
      });

      return true;
    } catch (error) {
      const err = error as { code?: number };

      if (err?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x61",
                chainName: "BNB Smart Chain Testnet",
                nativeCurrency: {
                  name: "tBNB",
                  symbol: "tBNB",
                  decimals: 18,
                },
                rpcUrls: [
                  "https://data-seed-prebsc-1-s1.bnbchain.org:8545/",
                ],
                blockExplorerUrls: [
                  "https://testnet.bscscan.com",
                ],
              },
            ],
          });

          return true;
        } catch {
          setWalletError("Could not add BNB Smart Chain Testnet.");
          return false;
        }
      }

      setWalletError("Please switch your wallet to BNB Smart Chain Testnet.");

      return false;
    }
  }

  async function continueToWallet() {
    setWalletLoading(true);
    setWalletError("");
    setTxHash("");

    try {
      let account = walletAddress;

      if (!account) {
        account = await connectWallet();
      }

      if (!account) return;

      const correctNetwork = await ensureBscTestnet();

      if (!correctNetwork) return;

      if (!window.ethereum) return;

      const hash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: account,
            to: TOKEN_ADDRESS,
            data: calldata,
            value: "0x0",
          },
        ],
      })) as string;

      setTxHash(hash);
    } catch {
      setWalletError(
        "Transaction was rejected or could not be sent."
      );
    } finally {
      setWalletLoading(false);
    }
  }

  function analyze() {
    const decoded = decodeFunctionData({
      abi,
      data: calldata,
    });

    if (decoded.functionName === "approve") {
      setStep("analysis");
    }
  }

  return (
    <main className="paham-paper min-h-screen bg-[#f3f0e8] text-[#1b1d1b]">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-16 flex items-center justify-between">
          <a
            href="/"
            aria-label="PAHAM home"
            className="flex items-center gap-2.5"
          >
            <img
              src="/paham-mark.svg"
              alt=""
              aria-hidden="true"
              className="h-7 w-7 shrink-0"
            />
            <span className="text-[17px] font-semibold tracking-[-0.035em]">
              PAHAM
            </span>
          </a>

          <button
            type="button"
            onClick={connectWallet}
            className="rounded-lg border border-[#d8d5cc] px-4 py-2 text-xs text-[#6f746f] transition hover:border-[#9fa39e] hover:text-[#1b1d1b]"
          >
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Wallet"}
          </button>
        </div>

        <div className="mb-12 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#355c67]">
            Pre-sign protection · BNB Chain Testnet
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
            See what a transaction asks before your wallet signs it.
          </h1>

          <p className="mt-5 leading-7 text-[#6f746f]">
            A controlled testnet scenario shows how a familiar
            action can request a much broader permission. PAHAM reviews
            the calldata before the wallet confirmation step.
          </p>
        </div>

        {step === "start" && (
          <section className="paham-dossier paham-surface overflow-hidden border border-[#c9c6bd] bg-[#fbfaf5]">
            <div className="flex items-center justify-between border-b border-[#d1cec4] px-6 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 bg-[#355c67]" />
                <span className="font-mono text-[10px] tracking-[0.12em] text-[#646964]">
                  COMMUNITY REWARDS
                </span>
              </div>

              <span className="font-mono text-[9px] text-[#858984]">
                BNB TESTNET
              </span>
            </div>

            <div className="grid md:grid-cols-[1.15fr_.85fr]">
              <div className="border-b border-[#d1cec4] p-7 md:border-b-0 md:border-r md:p-9">
                <p className="text-sm text-[#686d68]">
                  Reward available
                </p>

                <div className="paham-reward-mark mt-7 inline-block px-7 py-5">
                  <p className="text-[54px] font-medium leading-none tracking-[-0.06em]">
                    250
                  </p>
                  <p className="mt-2 font-mono text-xs tracking-[0.12em] text-[#355c67]">
                    PTT
                  </p>
                </div>

                <h2 className="mt-8 text-[28px] font-medium tracking-[-0.04em]">
                  Your testnet reward is ready.
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-[#666b67]">
                  Connect your wallet to continue with the reward claim
                  on BNB Smart Chain Testnet.
                </p>
              </div>

              <div className="flex flex-col justify-between p-7 md:p-9">
                <div className="divide-y divide-[#d1cec4] border-y border-[#d1cec4]">
                  <div className="flex justify-between gap-4 py-4">
                    <span className="text-xs text-[#7a7e79]">Status</span>
                    <span className="text-xs font-medium text-[#466653]">
                      Eligible
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 py-4">
                    <span className="text-xs text-[#7a7e79]">Network</span>
                    <span className="text-xs font-medium">
                      BNB Chain Testnet
                    </span>
                  </div>

                  <div className="flex justify-between gap-4 py-4">
                    <span className="text-xs text-[#7a7e79]">Asset</span>
                    <span className="text-xs font-medium">
                      PAHAM Test Token
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setStep("request")}
                  className="mt-8 w-full bg-[#1b1d1b] px-6 py-3.5 text-sm font-semibold text-[#fbfaf5] transition hover:bg-[#355c67]"
                >
                  Claim 250 PTT →
                </button>
              </div>
            </div>
          </section>
        )}

        {step === "request" && (
          <section className="paham-surface rounded-[18px] border border-[#d8d5cc] bg-[#fcfbf7] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#7a7e79]">
                  Transaction request
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Review the request before opening your wallet
                </h2>
              </div>

              <span className="rounded-lg bg-[#a46a2e]/[0.08] px-4 py-2 text-xs font-semibold text-[#8d5b29]">
                NOT SIGNED YET
              </span>
            </div>

            <div className="mt-8 space-y-5 rounded-xl border border-[#d8d5cc] bg-[#efede6] p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#838681]">
                  To
                </p>
                <p className="mt-2 break-all font-mono text-sm text-[#424742]">
                  {TOKEN_ADDRESS}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#838681]">
                  Raw calldata
                </p>
                <p className="mt-2 break-all font-mono text-sm leading-6 text-[#666b67]">
                  {calldata}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={analyze}
                className="rounded-lg bg-[#355c67] px-6 py-3 text-sm font-semibold text-[#fcfbf7]"
              >
                Review with PAHAM
              </button>

              <button
                onClick={() => setStep("start")}
                className="rounded-lg border border-[#d8d5cc] px-6 py-3 text-sm text-[#5e635f]"
              >
                Cancel
              </button>
            </div>
          </section>
        )}



        {/* PAHAM DEMO X-RAY V4 */}
        {step === "analysis" && (
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[9px] text-[#355c67]">
                02
              </span>

              <span className="h-px w-7 bg-[#355c67]" />

              <p className="font-mono text-[9px] tracking-[0.12em] text-[#727772]">
                DECODE THE REQUEST
              </p>
            </div>

            <TransactionXRay />
          </div>
        )}

{/* PAHAM SEMANTIC DIFF V3 */}
        {step === "analysis" && (
          <section className="paham-dossier paham-surface mb-5 border border-[#c9c6bd] bg-[#fbfaf5]">
            <div className="flex flex-col justify-between gap-4 border-b border-[#d1cec4] px-6 py-5 sm:flex-row sm:items-center md:px-8">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-2 w-2 bg-[#b64a3b]" />
                  <p className="font-mono text-[9px] tracking-[0.14em] text-[#777b76]">
                    03 / PAHAM FOUND A MISMATCH
                  </p>
                </div>

                <h2 className="mt-2 text-[24px] font-medium tracking-[-0.035em]">
                  The button says reward. The transaction asks for permission.
                </h2>
              </div>

              <div className="self-start border border-[#b64a3b]/25 bg-[#b64a3b]/[0.055] px-3 py-2">
                <span className="font-mono text-[9px] tracking-[0.08em] text-[#a44236]">
                  DETECTED BEFORE WALLET
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-[1fr_72px_1fr]">
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] tracking-[0.13em] text-[#777b76]">
                    WHAT YOU EXPECTED
                  </p>

                  <span className="font-mono text-[9px] text-[#466653]">
                    INTENT
                  </span>
                </div>

                <p className="mt-8 text-[15px] text-[#666b67]">
                  Claim a one-time reward.
                </p>

                <div className="mt-3 flex items-end gap-3">
                  <span className="text-[52px] font-medium leading-none tracking-[-0.055em]">
                    250
                  </span>

                  <span className="pb-1 font-mono text-[11px] tracking-[0.1em] text-[#355c67]">
                    PTT
                  </span>
                </div>

                <div className="mt-7 border-t border-[#d1cec4] pt-4">
                  <p className="text-xs leading-5 text-[#727772]">
                    This is what the interface leads the user to expect.
                  </p>
                </div>
              </div>

              <div className="relative hidden items-center justify-center border-x border-[#d1cec4] bg-[#ece9e1]/60 md:flex">
                <div className="text-center">
                  <p className="font-mono text-[8px] tracking-[0.12em] text-[#9b9e99]">
                    DIFF
                  </p>
                  <span className="mt-2 block text-[32px] font-light text-[#b64a3b] paham-semantic-diff-mark">
                    ≠
                  </span>
                </div>
              </div>

              <div className="border-t border-[#d1cec4] p-6 md:border-t-0 md:p-8">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9px] tracking-[0.13em] text-[#777b76]">
                    WHAT THE TRANSACTION ASKS
                  </p>

                  <span className="font-mono text-[9px] text-[#b64a3b]">
                    ACTUAL
                  </span>
                </div>

                <p className="mt-8 text-[15px] text-[#666b67]">
                  Grant reusable token permission.
                </p>

                <div className="mt-3">
                  <span className="inline-block border border-[#b64a3b]/30 bg-[#b64a3b]/[0.055] px-3 py-2 font-mono text-[13px] font-semibold text-[#a44236]">
                    UNLIMITED PTT
                  </span>
                </div>

                <div className="mt-7 border-t border-[#d1cec4] pt-4">
                  <p className="text-xs leading-5 text-[#727772]">
                    The spender can use the allowance up to the available
                    balance while the permission remains active.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#d1cec4] bg-[#f6f4ee]">
              <div className="grid lg:grid-cols-[190px_1fr]">
                <div className="border-b border-[#d1cec4] px-6 py-5 lg:border-b-0 lg:border-r md:px-8">
                  <p className="font-mono text-[9px] tracking-[0.13em] text-[#777b76]">
                    PERMISSION PATH
                  </p>

                  <p className="mt-2 text-xs leading-5 text-[#777b76]">
                    Follow the permission instead of trusting the button label.
                  </p>
                </div>

                <div className="px-6 py-6 md:px-8">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">

                    <div className="border border-[#cbc8bf] bg-[#fbfaf5] px-4 py-4">
                      <p className="font-mono text-[8px] tracking-[0.12em] text-[#92958f]">
                        OWNER
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        Your wallet
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-[#777b76]">
                        0x471F...5F76
                      </p>
                    </div>

                    <div className="hidden text-center sm:block">
                      <p className="font-mono text-[8px] text-[#8a8e89]">
                        grants
                      </p>
                      <p className="mt-1 text-[#355c67]">→</p>
                    </div>

                    <div className="border border-[#b64a3b]/30 bg-[#b64a3b]/[0.045] px-4 py-4">
                      <p className="font-mono text-[8px] tracking-[0.12em] text-[#a44236]">
                        SPENDER
                      </p>

                      <p className="mt-2 font-mono text-sm font-medium">
                        0x0000...dEaD
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-[#a44236]">
                        UNLIMITED ALLOWANCE
                      </p>
                    </div>

                    <div className="hidden text-center sm:block">
                      <p className="font-mono text-[8px] text-[#8a8e89]">
                        may use
                      </p>
                      <p className="mt-1 text-[#b64a3b]">→</p>
                    </div>

                    <div className="border border-[#cbc8bf] bg-[#fbfaf5] px-4 py-4">
                      <p className="font-mono text-[8px] tracking-[0.12em] text-[#92958f]">
                        ASSET
                      </p>

                      <p className="mt-2 text-sm font-medium">
                        PAHAM Test Token
                      </p>

                      <p className="mt-1 font-mono text-[9px] text-[#777b76]">
                        PTT
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col justify-between gap-4 border-t border-[#d1cec4] pt-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-[#b64a3b]" />

                      <p className="max-w-[590px] text-xs leading-5 text-[#686d68]">
                        No PTT moves when this approval is created. The important
                        consequence is the reusable permission that remains
                        available until it is changed or revoked.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          "PAHAM caught an unlimited PTT approval before my wallet opened. Expected: claim 250 PTT. Actual: grant an unlimited token allowance. Reviewed on BNB Chain Testnet with PAHAM."
                        );
                      }}
                      className="shrink-0 border border-[#b9bdb8] bg-[#fbfaf5] px-4 py-2.5 font-mono text-[9px] tracking-[0.07em] text-[#355c67] transition hover:border-[#355c67]"
                    >
                      COPY SECURITY FINDING
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

{step === "analysis" && (
          <section className="paham-demo-decision paham-report paham-report-danger paham-surface overflow-hidden border border-[#b64a3b]/25 bg-[#fbfaf5]">
            <div className="border-b border-[#d8d5cc] p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#7a7e79]">
                    Security review
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold">
                    Unlimited Token Approval
                  </h2>
                </div>

                <span className="rounded-lg bg-[#b64a3b]/10 px-4 py-2 text-xs font-bold text-[#a44236]">
                  HIGH RISK
                </span>
              </div>
            </div>

            <div className="grid gap-8 p-8 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7a7e79]">
                  Expected action
                </p>

                <p className="mt-3 text-xl text-[#303430]">
                  “I am claiming a reward.”
                </p>

                <div className="mt-8 rounded-xl border border-[#b64a3b]/25 bg-[#b64a3b]/[0.055] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a44236]">
                    Actual permission requested
                  </p>

                  <p className="mt-3 leading-7 text-[#424742]">
                    Grant another address an unlimited allowance for
                    your PAHAM Test Token. The spender can use that
                    allowance while the permission remains active.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#838681]">
                    Token
                  </p>
                  <p className="mt-2 font-mono text-sm">
                    PAHAM Test Token (PTT)
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#838681]">
                    Spender
                  </p>
                  <p className="mt-2 break-all font-mono text-sm">
                    {SPENDER}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#838681]">
                    Permission
                  </p>
                  <p className="mt-2 font-mono text-sm text-[#a44236]">
                    Unlimited PTT
                  </p>
                </div>

                <div className="rounded-xl border border-[#355c67]/25 bg-[#355c67]/[0.05] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#355c67]">
                    Before you continue
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#555a56]">
                    Verify that you recognize the spender and that
                    unlimited access is actually required. If either is
                    unclear, reject the request.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#d8d5cc] p-6">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setStep("start");
                    setWalletError("");
                    setTxHash("");
                  }}
                  className="rounded-lg bg-[#1b1d1b] px-6 py-3 text-sm font-semibold text-[#fcfbf7]"
                >
                  Reject Request
                </button>

                <button
                  onClick={continueToWallet}
                  disabled={walletLoading}
                  className="rounded-lg border border-[#b64a3b]/35 px-6 py-3 text-sm font-semibold text-[#a44236] transition hover:bg-[#b64a3b]/[0.07] disabled:opacity-50"
                >
                  {walletLoading
                    ? "Opening wallet..."
                    : "Continue to Wallet"}
                </button>
              </div>

              <p className="mt-4 max-w-xl text-xs leading-5 text-[#838681]">
                Demo only. Continuing sends a real approval transaction
                for PAHAM Test Token on BNB Smart Chain Testnet.
                No mainnet assets are involved.
              </p>

              {walletError && (
                <div className="mt-4 rounded-xl border border-[#b64a3b]/25 bg-[#b64a3b]/[0.07] p-4 text-sm text-[#a44236]">
                  {walletError}
                </div>
              )}

              {txHash && (
                <div className="mt-4 rounded-xl border border-[#355c67]/25 bg-[#355c67]/[0.06] p-4">
                  <p className="text-sm font-medium text-[#355c67]">
                    Transaction submitted.
                  </p>

                  <a
                    href={`https://testnet.bscscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all font-mono text-xs text-[#6f746f] hover:text-[#355c67]"
                  >
                    {txHash} ↗
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
