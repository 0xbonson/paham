"use client";

import { useMemo, useState } from "react";
import {
  decodeFunctionData,
  encodeFunctionData,
  parseAbi,
} from "viem";
import {
  ActualAuthority,
  ExpectedIntent,
  compareIntentToAuthority,
  createIntentReceiptPayload,
} from "@/lib/intent-integrity";

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

const MAX_UINT256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

const abi = parseAbi([
  "function approve(address spender, uint256 amount)",
]);

const calldata = encodeFunctionData({
  abi,
  functionName: "approve",
  args: [SPENDER, MAX_UINT256],
});

const visibleClaimText = `
Community Rewards.
Reward available: 250 PTT.
Asset: PAHAM Test Token.
Status: Eligible.
Claim 250 PTT.
`;

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function IntentDemoPage() {
  const [expected, setExpected] = useState<ExpectedIntent | null>(null);
  const [receiptHash, setReceiptHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [txHash, setTxHash] = useState("");

  const actual = useMemo<ActualAuthority>(() => {
    const decoded = decodeFunctionData({
      abi,
      data: calldata,
    });

    return {
      functionName: decoded.functionName,
      asset: "PTT",
      amount: "MAX_UINT256",
      direction: "permission",
      permission: "unlimited",
      spender: SPENDER,
    };
  }, []);

  const integrity = expected
    ? compareIntentToAuthority(expected, actual)
    : null;

  async function captureIntent() {
    setLoading(true);
    setWalletMessage("");
    setReceiptHash("");

    try {
      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibleText: visibleClaimText }),
      });

      const data = await response.json();

      if (!response.ok || !data.intent) {
        throw new Error("Intent capture failed");
      }

      const intent: ExpectedIntent = {
        ...data.intent,
        source: data.source,
        rawEvidence: visibleClaimText.trim(),
      };

      const result = compareIntentToAuthority(intent, actual);
      const receipt = createIntentReceiptPayload(
        intent,
        actual,
        result,
        window.location.origin
      );

      setExpected(intent);
      setReceiptHash(await sha256(JSON.stringify(receipt)));
    } catch {
      setWalletMessage("Could not capture interface intent.");
    } finally {
      setLoading(false);
    }
  }

  async function continueToWallet() {
    setWalletLoading(true);
    setWalletMessage("");
    setTxHash("");

    try {
      if (!window.ethereum) {
        setWalletMessage("No browser wallet detected. Install Rabby or MetaMask.");
        return;
      }

      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const account = accounts[0];

      if (!account) {
        setWalletMessage("Wallet connection was cancelled.");
        return;
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x61" }],
        });
      } catch (error) {
        const err = error as { code?: number };

        if (err?.code === 4902) {
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
                blockExplorerUrls: ["https://testnet.bscscan.com"],
              },
            ],
          });
        } else {
          throw error;
        }
      }

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
      setWalletMessage("Transaction was rejected or could not be sent.");
    } finally {
      setWalletLoading(false);
    }
  }

  return (
    <main className="paham-paper min-h-screen bg-[#f3f0e8] text-[#1b1d1b]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <header className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img
              src="/paham-mark.svg"
              alt=""
              aria-hidden="true"
              className="h-7 w-7"
            />
            <span className="text-[17px] font-semibold tracking-[-0.035em]">
              PAHAM
            </span>
          </a>

          <span className="font-mono text-[9px] tracking-[0.12em] text-[#777b76]">
            INTENT INTEGRITY PROTOTYPE
          </span>
        </header>

        <section className="mt-16 max-w-3xl">
          <p className="font-mono text-[10px] tracking-[0.14em] text-[#355c67]">
            CONTROLLED ADVERSARIAL DEMO · BNB CHAIN TESTNET
          </p>

          <h1 className="mt-5 text-4xl font-medium leading-[0.98] tracking-[-0.055em] md:text-6xl">
            Verify what you meant against what you sign.
          </h1>

          <p className="mt-6 max-w-2xl text-[16px] leading-7 text-[#626762]">
            PAHAM captures evidence of the action shown to the user, decodes the
            transaction authority separately, and deterministically compares the
            two before the wallet opens.
          </p>

          <p className="mt-3 max-w-2xl text-xs leading-5 text-[#858984]">
            This demo is intentionally misleading. PTT is PAHAM Test Token on
            BNB Smart Chain Testnet and has no real monetary value.
          </p>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-[1fr_.78fr]">
          <div className="paham-dossier border border-[#c9c6bd] bg-[#fbfaf5]">
            <div className="border-b border-[#d1cec4] px-6 py-4">
              <p className="font-mono text-[9px] tracking-[0.13em] text-[#777b76]">
                SIMULATED DAPP / WHAT THE USER SEES
              </p>
            </div>

            <div className="p-7 md:p-8">
              <p className="text-sm text-[#6c716c]">Community reward</p>

              <div className="mt-6 flex items-end gap-3">
                <span className="text-[58px] font-medium leading-none tracking-[-0.06em]">
                  250
                </span>
                <span className="pb-1 font-mono text-xs tracking-[0.12em] text-[#355c67]">
                  PTT
                </span>
              </div>

              <h2 className="mt-8 text-[26px] font-medium tracking-[-0.04em]">
                Your testnet reward is ready.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#666b67]">
                PTT means PAHAM Test Token. It exists only for this controlled
                testnet demonstration.
              </p>

              <button
                type="button"
                onClick={captureIntent}
                disabled={loading}
                className="mt-8 w-full bg-[#1b1d1b] px-6 py-3.5 text-sm font-semibold text-[#fbfaf5] transition hover:bg-[#355c67] disabled:opacity-50"
              >
                {loading ? "Capturing intent…" : "Claim 250 PTT →"}
              </button>
            </div>
          </div>

          <div className="border border-[#c9c6bd] bg-[#ece9e1] p-6">
            <p className="font-mono text-[9px] tracking-[0.13em] text-[#777b76]">
              THREAT MODEL
            </p>

            <div className="mt-6 space-y-5 text-sm leading-6 text-[#626762]">
              <p>
                UI evidence records what the interface presented. It is not proof
                that the dApp itself is trustworthy.
              </p>
              <p>
                Transaction authority is decoded independently from calldata.
              </p>
              <p>
                A mismatch means the two representations disagree. It does not,
                by itself, prove malicious intent.
              </p>
            </div>
          </div>
        </section>

        {expected && integrity && (
          <>
            <section className="mt-5 grid border border-[#c9c6bd] bg-[#fbfaf5] lg:grid-cols-3">
              <div className="border-b border-[#d1cec4] p-6 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[9px] tracking-[0.12em] text-[#355c67]">
                  01 / INTENT EVIDENCE
                </p>

                <h3 className="mt-4 text-xl font-medium">
                  What the interface presented
                </h3>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-[#858984]">Action</dt>
                    <dd className="mt-1 font-mono uppercase">
                      {expected.action}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Expected flow</dt>
                    <dd className="mt-1">
                      Receive {expected.amount} {expected.asset}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Reusable permission</dt>
                    <dd className="mt-1 font-mono uppercase">
                      {expected.permission}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Capture source</dt>
                    <dd className="mt-1 font-mono">{expected.source}</dd>
                  </div>
                </dl>
              </div>

              <div className="border-b border-[#d1cec4] p-6 lg:border-b-0 lg:border-r">
                <p className="font-mono text-[9px] tracking-[0.12em] text-[#355c67]">
                  02 / TRANSACTION AUTHORITY
                </p>

                <h3 className="mt-4 text-xl font-medium">
                  What the calldata authorizes
                </h3>

                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-[#858984]">Function</dt>
                    <dd className="mt-1 font-mono">{actual.functionName}()</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Spender</dt>
                    <dd className="mt-1 font-mono">0x0000...dEaD</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Permission</dt>
                    <dd className="mt-1 font-mono text-[#a44236]">
                      MAX_UINT256 / UNLIMITED
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-[#858984]">Immediate token movement</dt>
                    <dd className="mt-1">None at approval creation</dd>
                  </div>
                </dl>
              </div>

              <div className="p-6">
                <p className="font-mono text-[9px] tracking-[0.12em] text-[#b64a3b]">
                  03 / INTENT INTEGRITY
                </p>

                <div className="mt-4 inline-block border border-[#b64a3b]/30 bg-[#b64a3b]/[0.055] px-3 py-2">
                  <span className="font-mono text-sm font-semibold text-[#a44236]">
                    {integrity.verdict}
                  </span>
                </div>

                <div className="mt-6 space-y-4">
                  {integrity.findings.map((finding) => (
                    <div
                      key={finding.code}
                      className="border-t border-[#d1cec4] pt-4"
                    >
                      <p className="font-mono text-[9px] text-[#a44236]">
                        {finding.code}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#626762]">
                        {finding.explanation}
                      </p>
                      <p className="mt-2 font-mono text-[10px] text-[#858984]">
                        {finding.expected} → {finding.actual}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-5 border border-[#c9c6bd] bg-[#f6f4ee] p-6">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                <div>
                  <p className="font-mono text-[9px] tracking-[0.12em] text-[#777b76]">
                    INTENT RECEIPT / LOCAL AUDIT ARTIFACT
                  </p>

                  <p className="mt-2 max-w-2xl text-xs leading-5 text-[#777b76]">
                    PAHAM hashes the captured intent, decoded authority, and
                    deterministic comparison into a local receipt. The hash is an
                    audit identifier, not proof that the dApp is honest.
                  </p>

                  <p className="mt-4 break-all font-mono text-[10px] text-[#355c67]">
                    sha256:{receiptHash}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExpected(null);
                      setReceiptHash("");
                      setWalletMessage("");
                    }}
                    className="border border-[#c9c6bd] px-5 py-3 text-sm"
                  >
                    Reject request
                  </button>

                  <button
                    type="button"
                    onClick={continueToWallet}
                    disabled={walletLoading}
                    className="bg-[#1b1d1b] px-5 py-3 text-sm font-semibold text-[#fbfaf5] disabled:opacity-50"
                  >
                    {walletLoading ? "Opening wallet…" : "Continue to wallet"}
                  </button>
                </div>
              </div>

              {walletMessage && (
                <p className="mt-5 text-sm text-[#a44236]">{walletMessage}</p>
              )}

              {txHash && (
                <a
                  href={`https://testnet.bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-block text-sm text-[#355c67] underline underline-offset-4"
                >
                  View submitted testnet transaction on BscScan ↗
                </a>
              )}
            </section>
          </>
        )}

        <footer className="mt-14 border-t border-[#d1cec4] py-8 text-xs leading-5 text-[#858984]">
          PAHAM Intent Integrity is a prototype. It compares user-visible intent
          evidence with supported transaction semantics. It does not prove that a
          website or address is safe or malicious.
        </footer>
      </div>
    </main>
  );
}
