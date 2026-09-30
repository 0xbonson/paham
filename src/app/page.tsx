"use client";
import TransactionXRay from "@/components/transaction-xray";

import { useState } from "react";
import {
  decodeFunctionData,
  formatEther,
  formatUnits,
  parseAbi,
} from "viem";

const abi = parseAbi([
  "function approve(address spender, uint256 amount)",
  "function transfer(address to, uint256 amount)",
  "function transferFrom(address from, address to, uint256 amount)",
  "function setApprovalForAll(address operator, bool approved)",
]);

const MAX_UINT256 = BigInt(
  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
);

const EXAMPLE_TX =
  "0xebdb2339eb5849558058ddacdd75daff5f94512d1ed5aa035b83864baa8f2e18";

type Risk = "LOW" | "MEDIUM" | "HIGH";

type AnalysisResult = {
  action: string;
  risk: Risk;
  title: string;
  explanation: string;
  details: {
    label: string;
    value: string;
  }[];
  txHash?: string;
};

type TxResponse = {
  hash: string;
  from: string;
  to: string | null;
  input: `0x${string}`;
  value: string;
  blockNumber: string | null;
  error?: string;
};

type TokenMetadata = {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  isERC20: boolean;
};

function shortAddress(value: string) {
  if (!value.startsWith("0x") || value.length < 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function riskStyles(risk: Risk) {
  if (risk === "HIGH") {
    return {
      text: "text-[#b64a3b]",
      border: "border-[#b64a3b]/25",
      bg: "bg-[#b64a3b]/[0.055]",
    };
  }

  if (risk === "MEDIUM") {
    return {
      text: "text-[#a46a2e]",
      border: "border-[#a46a2e]/25",
      bg: "bg-[#a46a2e]/[0.055]",
    };
  }

  return {
    text: "text-[#466653]",
    border: "border-[#466653]/25",
    bg: "bg-[#466653]/[0.055]",
  };
}

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [aiExplanation, setAiExplanation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiLanguage, setAiLanguage] = useState<"id" | "en">("id");

  function decodeCalldata(
    calldata: `0x${string}`,
    txHash?: string,
    token?: TokenMetadata | null
  ): AnalysisResult {
    const decoded = decodeFunctionData({
      abi,
      data: calldata,
    });

    const functionName = decoded.functionName;
    const args = decoded.args;

    if (functionName === "approve") {
      const [spender, amount] = args as readonly [
        `0x${string}`,
        bigint
      ];

      const unlimited = amount === MAX_UINT256;

      return {
        action: "APPROVE",
        risk: unlimited ? "HIGH" : "MEDIUM",
        title: unlimited
          ? "Unlimited token approval"
          : "Token spending approval",
        explanation: unlimited
          ? "This request gives another address an unlimited allowance for this token. No tokens move when the approval is created, but the permission can be used later while it remains active."
          : "This request allows another address to spend a limited amount of this token.",
        details: [
          {
            label: "Spender",
            value: spender,
          },
          ...(token?.isERC20
            ? [
                {
                  label: "Token",
                  value: `${token.name ?? "Unknown token"}${
                    token.symbol ? ` (${token.symbol})` : ""
                  }`,
                },
              ]
            : []),
          {
            label: "Allowance",
            value: unlimited
              ? `Unlimited${token?.symbol ? ` ${token.symbol}` : ""}`
              : token?.decimals != null
                ? `${formatUnits(amount, token.decimals)}${
                    token.symbol ? ` ${token.symbol}` : ""
                  }`
                : amount.toString(),
          },
        ],
        txHash,
      };
    }

    if (functionName === "transfer") {
      const [to, amount] = args as readonly [
        `0x${string}`,
        bigint
      ];

      return {
        action: "TRANSFER",
        risk: "MEDIUM",
        title: "Token transfer",
        explanation:
          "This transaction sends tokens from your wallet to another address. Check the recipient and amount before signing.",
        details: [
          {
            label: "Recipient",
            value: to,
          },
          ...(token?.isERC20
            ? [
                {
                  label: "Token",
                  value: `${token.name ?? "Unknown token"}${
                    token.symbol ? ` (${token.symbol})` : ""
                  }`,
                },
              ]
            : []),
          {
            label: "Amount",
            value:
              token?.decimals != null
                ? `${formatUnits(amount, token.decimals)}${
                    token.symbol ? ` ${token.symbol}` : ""
                  }`
                : amount.toString(),
          },
        ],
        txHash,
      };
    }

    if (functionName === "transferFrom") {
      const [from, to, amount] = args as readonly [
        `0x${string}`,
        `0x${string}`,
        bigint
      ];

      return {
        action: "TRANSFER FROM",
        risk: "HIGH",
        title: "Transfer using existing permission",
        explanation:
          "This transaction attempts to move tokens using an allowance that was granted previously.",
        details: [
          {
            label: "From",
            value: from,
          },
          {
            label: "To",
            value: to,
          },
          ...(token?.isERC20
            ? [
                {
                  label: "Token",
                  value: `${token.name ?? "Unknown token"}${
                    token.symbol ? ` (${token.symbol})` : ""
                  }`,
                },
              ]
            : []),
          {
            label: "Amount",
            value:
              token?.decimals != null
                ? `${formatUnits(amount, token.decimals)}${
                    token.symbol ? ` ${token.symbol}` : ""
                  }`
                : amount.toString(),
          },
        ],
        txHash,
      };
    }

    if (functionName === "setApprovalForAll") {
      const [operator, approved] = args as readonly [
        `0x${string}`,
        boolean
      ];

      return {
        action: "SET APPROVAL FOR ALL",
        risk: approved ? "HIGH" : "LOW",
        title: approved
          ? "Collection-wide NFT permission"
          : "NFT permission revocation",
        explanation: approved
          ? "This request gives another address permission to manage every NFT you own from this collection."
          : "This request removes an operator's permission to manage NFTs from this collection.",
        details: [
          {
            label: "Operator",
            value: operator,
          },
          {
            label: "Permission",
            value: approved ? "Enabled" : "Disabled",
          },
        ],
        txHash,
      };
    }

    throw new Error("Unsupported function");
  }

  async function analyze() {
    setError("");
    setResult(null);
    setAiExplanation("");

    const value = input.trim();

    if (!value.startsWith("0x")) {
      setError("Input must begin with 0x.");
      return;
    }

    setLoading(true);

    try {
      const isTransactionHash = /^0x[a-fA-F0-9]{64}$/.test(value);

      if (isTransactionHash) {
        const response = await fetch(
          `/api/tx?hash=${encodeURIComponent(value)}`
        );

        const tx = (await response.json()) as TxResponse;

        if (!response.ok) {
          throw new Error(tx.error || "Transaction not found.");
        }

        if (tx.input === "0x") {
          setResult({
            action: "NATIVE TRANSFER",
            risk: "MEDIUM",
            title: "BNB transfer",
            explanation:
              "This transaction sends BNB directly from one address to another. No smart contract function is being called.",
            details: [
              {
                label: "From",
                value: tx.from,
              },
              {
                label: "Recipient",
                value: tx.to ?? "Contract creation",
              },
              {
                label: "Amount",
                value: `${formatEther(BigInt(tx.value))} tBNB`,
              },
              {
                label: "Block",
                value: tx.blockNumber ?? "Pending",
              },
            ],
            txHash: tx.hash,
          });

          return;
        }

        try {
          let token: TokenMetadata | null = null;

          if (tx.to) {
            try {
              const tokenResponse = await fetch(
                `/api/token?address=${encodeURIComponent(tx.to)}`
              );

              if (tokenResponse.ok) {
                token =
                  (await tokenResponse.json()) as TokenMetadata;
              }
            } catch {
              token = null;
            }
          }

          const decoded = decodeCalldata(
            tx.input,
            tx.hash,
            token
          );

          decoded.details.unshift(
            {
              label: "From",
              value: tx.from,
            },
            {
              label: token?.isERC20
                ? "Token contract"
                : "Contract",
              value: tx.to ?? "Unknown",
            }
          );

          setResult(decoded);
          return;
        } catch {
          setResult({
            action: "CONTRACT INTERACTION",
            risk: "MEDIUM",
            title: "Unknown contract interaction",
            explanation:
              "PAHAM found a smart contract call, but this function is not yet included in the supported decoder.",
            details: [
              {
                label: "From",
                value: tx.from,
              },
              {
                label: "Contract",
                value: tx.to ?? "Unknown",
              },
              {
                label: "Function selector",
                value: tx.input.slice(0, 10),
              },
            ],
            txHash: tx.hash,
          });

          return;
        }
      }

      setResult(
        decodeCalldata(value as `0x${string}`)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze this transaction."
      );
    } finally {
      setLoading(false);
    }
  }

  async function explainWithAI(
    language: "id" | "en" = aiLanguage
  ) {
    if (!result) return;

    setAiLoading(true);
    setAiExplanation("");
    setError("");

    const getDetail = (label: string) =>
      result.details.find(
        (detail) => detail.label === label
      )?.value;

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: result.action,
          risk: result.risk,
          token: getDetail("Token") ?? "Unknown token",
          spender: getDetail("Spender") ?? "Unknown",
          allowance: getDetail("Allowance") ?? "Unknown",
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "AI explanation failed."
        );
      }

      setAiExplanation(data.explanation);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate explanation."
      );
    } finally {
      setAiLoading(false);
    }
  }

  const styles = result
    ? riskStyles(result.risk)
    : null;

  return (
    <main className="paham-paper min-h-screen bg-[#f3f0e8] text-[#1b1d1b]">
      <div className="mx-auto max-w-[1180px] px-5 md:px-8">
        <header className="flex h-20 items-center justify-between border-b border-[#d8d5cc]">
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

          <div className="flex items-center gap-6">
            <a
              href="/demo"
              className="hidden text-sm text-[#686d68] transition hover:text-[#1b1d1b] md:block"
            >
              Pre-sign protection
            </a>

            <div className="flex items-center gap-2 text-xs text-[#747873]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#355c67]" />
              BNB Chain Testnet
            </div>
          </div>
        </header>

        <section className="grid gap-12 py-16 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:py-24">
          <div className="max-w-[720px]">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#355c67]" />
              <p className="font-mono text-[10px] tracking-[0.14em] text-[#626762]">
                PRE-SIGN SECURITY / BNB TESTNET
              </p>
            </div>

            <h1 className="text-[50px] font-medium leading-[.96] tracking-[-0.055em] sm:text-[64px] lg:text-[78px]">
              Read the
              <br />
              <span className="relative inline-block">
                transaction
                <span className="absolute -bottom-2 left-0 h-[5px] w-[42%] bg-[#355c67]" />
              </span>
              <br />
              not the button.
            </h1>

            <p className="mt-8 max-w-[590px] text-[17px] leading-7 text-[#5e635f]">
              Interfaces can say Claim, Mint, Swap, or Continue.
              Your wallet signs calldata. PAHAM shows what that calldata
              actually authorizes before you make the final decision.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="#analyzer"
                className="bg-[#1b1d1b] px-5 py-3 text-sm font-medium text-[#fbfaf5] transition hover:bg-[#355c67]"
              >
                Analyze transaction
              </a>

              <a
                href="/demo"
                className="border border-[#bcb9b0] bg-[#f8f6f0] px-5 py-3 text-sm font-medium text-[#4f544f] transition hover:border-[#355c67] hover:text-[#294b54]"
              >
                See pre-sign demo →
              </a>
            </div>
          </div>

          <div className="relative xl:-ml-4 xl:-mr-24 xl:translate-y-3">
            <div className="pointer-events-none absolute -left-8 top-[72px] hidden items-center gap-3 xl:flex">
              <span className="font-mono text-[8px] tracking-[0.1em] text-[#8b8f8a]">
                INSPECT
              </span>
              <span className="h-px w-10 bg-[#355c67]" />
            </div>

            <TransactionXRay />

            <div className="mt-3 flex items-center justify-between px-1">
              <p className="font-mono text-[8px] tracking-[0.1em] text-[#898d88]">
                SPECIMEN 001 / ERC-20 APPROVAL
              </p>

              <p className="font-mono text-[8px] tracking-[0.1em] text-[#355c67]">
                RAW ↔ HUMAN
              </p>
            </div>
          </div>
        </section>

        <section
          id="analyzer"
          className="border-t border-[#d1cec4] py-14 md:py-20"
        >
          <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="flex gap-5">
              <span className="font-mono text-[11px] text-[#355c67]">
                02
              </span>

              <div>
                <p className="font-mono text-[10px] tracking-[0.13em] text-[#777b76]">
                  TRANSACTION ANALYZER
                </p>

                <h2 className="mt-2 text-[30px] font-medium tracking-[-0.04em]">
                  Inspect what the wallet will execute.
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#707570]">
              <span className="paham-status-dot" />
              Decoder ready
            </div>
          </div>

          <div className="paham-dossier paham-surface border border-[#c9c6bd] bg-[#fbfaf5]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d1cec4] px-5 py-4 md:px-6">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] tracking-[0.12em] text-[#8a8e89]">
                  INPUT / 0x
                </span>
                <span className="h-3 w-px bg-[#c9c6bd]" />
                <span className="text-xs text-[#686d68]">
                  Transaction hash or raw calldata
                </span>
              </div>

              <button
                type="button"
                onClick={() => setInput(EXAMPLE_TX)}
                className="font-mono text-[10px] text-[#355c67] underline decoration-[#355c67]/35 underline-offset-4 transition hover:decoration-[#355c67]"
              >
                LOAD REAL TESTNET EXAMPLE
              </button>
            </div>

            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="0x..."
              spellCheck={false}
              className="min-h-[124px] w-full resize-none bg-transparent p-6 font-mono text-[13px] leading-6 text-[#303430] outline-none placeholder:text-[#a1a39e] md:p-8"
            />

            <div className="flex flex-col justify-between gap-4 border-t border-[#d1cec4] bg-[#f6f4ee] p-4 sm:flex-row sm:items-center md:px-6">
              <div>
                <p className="font-mono text-[9px] tracking-[0.11em] text-[#838681]">
                  SUPPORTED DECODERS
                </p>
                <p className="mt-1 font-mono text-[10px] text-[#646964]">
                  approve · transfer · transferFrom · setApprovalForAll
                </p>
              </div>

              <button
                type="button"
                onClick={analyze}
                disabled={loading}
                className="min-w-[150px] bg-[#355c67] px-6 py-3 text-sm font-semibold text-[#fbfaf5] transition hover:bg-[#294b54] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Analyzing…" : "Analyze →"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 border-l-[3px] border-[#b64a3b] bg-[#b64a3b]/[0.055] px-5 py-4 text-sm text-[#a44236]">
              {error}
            </div>
          )}
        </section>

        {result && styles && (
          <section className="py-14 md:py-20">
            <div className="paham-report paham-surface border border-[#d1cec4] bg-[#fbfaf5]">
              <div className="grid gap-8 border-b border-[#d8d5cc] p-6 md:grid-cols-[1fr_auto] md:p-9">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7c807b]">
                      Security review
                    </p>

                    <span className="h-px w-8 bg-white/15" />

                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7c807b]">
                      {result.action}
                    </p>
                  </div>

                  <h2 className="mt-5 text-[32px] font-medium tracking-[-0.04em] md:text-[42px]">
                    {result.title}
                  </h2>

                  <p className="mt-5 max-w-2xl text-[16px] leading-7 text-[#626762]">
                    {result.explanation}
                  </p>
                </div>

                <div
                  className={`self-start border px-5 py-4 ${styles.border} ${styles.bg}`}
                >
                  <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[#7c807b]">
                    Risk
                  </p>
                  <p
                    className={`mt-1 text-xl font-semibold tracking-[-0.03em] ${styles.text}`}
                  >
                    {result.risk}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-[.9fr_1.1fr]">
                <div className="border-b border-[#d8d5cc] p-6 md:border-b-0 md:border-r md:p-9">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7c807b]">
                    What you are authorizing
                  </p>

                  <div className="mt-7 space-y-7">
                    {result.details.map(
                      (detail, index) => (
                        <div
                          key={`${detail.label}-${index}`}
                        >
                          <p className="text-xs text-[#7c807b]">
                            {detail.label}
                          </p>

                          <p
                            title={detail.value}
                            className="mt-2 break-all font-mono text-[13px] leading-6 text-[#343834]"
                          >
                            {detail.value.startsWith("0x")
                              ? shortAddress(detail.value)
                              : detail.value}
                          </p>
                        </div>
                      )
                    )}
                  </div>

                  {result.txHash && (
                    <a
                      href={`https://testnet.bscscan.com/tx/${result.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-9 inline-block border-b border-[#a8aaa5] pb-1 text-xs text-[#686d68] transition hover:border-white hover:text-[#1b1d1b]"
                    >
                      View transaction on BscScan ↗
                    </a>
                  )}
                </div>

                <div className="p-6 md:p-9">
                  {result.action === "APPROVE" &&
                    result.risk === "HIGH" && (
                      <>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7c807b]">
                          Why this matters
                        </p>

                        <div className="mt-6 divide-y divide-white/[0.07] border-y border-[#dedbd3]">
                          {[
                            [
                              "01",
                              "The permission remains active until changed or revoked.",
                            ],
                            [
                              "02",
                              "The spender can use the allowance later, up to the available balance, while this permission remains active.",
                            ],
                            [
                              "03",
                              "No token movement at approval time does not make the permission harmless.",
                            ],
                          ].map(([number, copy]) => (
                            <div
                              key={number}
                              className="grid grid-cols-[36px_1fr] gap-4 py-4"
                            >
                              <span className="font-mono text-[10px] text-[#b64a3b]">
                                {number}
                              </span>

                              <p className="text-sm leading-6 text-[#626762]">
                                {copy}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-8">
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#355c67]">
                            Before you continue
                          </p>

                          <p className="mt-3 max-w-xl text-sm leading-6 text-[#626762]">
                            Verify that the spender belongs to the
                            application you intended to use. If you
                            do not recognize it, reject the request.
                            Prefer a limited allowance when unlimited
                            access is unnecessary.
                          </p>
                        </div>
                      </>
                    )}

                  <div className="mt-10 border-t border-[#d8d5cc] pt-8">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#7c807b]">
                          Plain-language explanation
                        </p>

                        <p className="mt-2 max-w-md text-xs leading-5 text-[#858984]">
                          Generated from verified transaction facts.
                          AI does not determine the risk level.
                        </p>
                      </div>

                      <div className="flex border border-[#d8d5cc]">
                        {(["id", "en"] as const).map(
                          (language) => (
                            <button
                              key={language}
                              type="button"
                              onClick={() => {
                                setAiLanguage(language);

                                if (aiExplanation) {
                                  explainWithAI(language);
                                }
                              }}
                              className={`px-3 py-2 font-mono text-[10px] uppercase transition ${
                                aiLanguage === language
                                  ? "bg-[#1b1d1b] text-[#fcfbf7]"
                                  : "text-[#777b76] hover:text-[#1b1d1b]"
                              }`}
                            >
                              {language}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {!aiExplanation ? (
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={() => explainWithAI()}
                        className="mt-6 border-b border-[#355c67]/70 pb-1 text-sm text-[#355c67] transition hover:border-[#355c67] disabled:opacity-50"
                      >
                        {aiLoading
                          ? "Generating explanation…"
                          : "Explain in plain language"}
                      </button>
                    ) : (
                      <div className="mt-6 border-l border-[#355c67]/50 pl-5">
                        <p className="max-w-2xl text-[15px] leading-7 text-[#474c48]">
                          {aiExplanation}
                        </p>

                        <button
                          type="button"
                          disabled={aiLoading}
                          onClick={() => explainWithAI()}
                          className="mt-4 text-xs text-[#7c807b] transition hover:text-[#1b1d1b]/65"
                        >
                          {aiLoading
                            ? "Regenerating…"
                            : "Regenerate"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}


        {/* PAHAM VALUE SURFACE V3 */}
        <section className="border-y border-[#c9c6bd] bg-[#fbfaf5]">
          <div className="grid lg:grid-cols-[.78fr_1.22fr]">
            <div className="border-b border-[#d1cec4] p-7 lg:border-b-0 lg:border-r lg:p-9">
              <div className="flex items-center gap-3">
                <span className="h-[2px] w-7 bg-[#355c67]" />
                <p className="font-mono text-[9px] tracking-[0.14em] text-[#6d726d]">
                  WHY PAHAM EXISTS
                </p>
              </div>

              <h2 className="mt-6 max-w-[390px] text-[32px] font-medium leading-[1.02] tracking-[-0.045em]">
                The dangerous part is often not what the button says.
              </h2>

              <p className="mt-5 max-w-[400px] text-sm leading-6 text-[#686d68]">
                A familiar interface can trigger a transaction with much broader
                consequences. PAHAM reads the transaction itself, not the label
                on the button.
              </p>

              <div className="mt-9 inline-flex items-center gap-2 border border-[#bfc5c1] bg-[#f3f5f2] px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#466653]" />
                <span className="font-mono text-[9px] tracking-[0.08em] text-[#536058]">
                  FACTS BEFORE EXPLANATION
                </span>
              </div>
            </div>

            <div>
              <div className="grid min-h-[120px] grid-cols-[38px_1fr] gap-4 border-b border-[#d1cec4] p-6 sm:grid-cols-[42px_190px_1fr] sm:items-center lg:px-8">
                <span className="font-mono text-[10px] text-[#355c67]">
                  01
                </span>

                <div>
                  <p className="text-[16px] font-medium tracking-[-0.02em]">
                    Unlimited approvals
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-[#9b652e]">
                    approve(..., MAX_UINT256)
                  </p>
                </div>

                <p className="col-start-2 text-sm leading-6 text-[#6a6f6a] sm:col-start-auto">
                  See when a transaction grants reusable token allowance instead
                  of performing the action you expected.
                </p>
              </div>

              <div className="grid min-h-[120px] grid-cols-[38px_1fr] gap-4 border-b border-[#d1cec4] p-6 sm:grid-cols-[42px_190px_1fr] sm:items-center lg:px-8">
                <span className="font-mono text-[10px] text-[#355c67]">
                  02
                </span>

                <div>
                  <p className="text-[16px] font-medium tracking-[-0.02em]">
                    NFT operator access
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-[#9b652e]">
                    setApprovalForAll(...)
                  </p>
                </div>

                <p className="col-start-2 text-sm leading-6 text-[#6a6f6a] sm:col-start-auto">
                  Understand when an operator is being authorized across an NFT
                  collection rather than for a single asset.
                </p>
              </div>

              <div className="grid min-h-[120px] grid-cols-[38px_1fr] gap-4 p-6 sm:grid-cols-[42px_190px_1fr] sm:items-center lg:px-8">
                <span className="font-mono text-[10px] text-[#355c67]">
                  03
                </span>

                <div>
                  <p className="text-[16px] font-medium tracking-[-0.02em]">
                    Unexpected transfers
                  </p>
                  <p className="mt-1 font-mono text-[9px] text-[#9b652e]">
                    transfer / transferFrom
                  </p>
                </div>

                <p className="col-start-2 text-sm leading-6 text-[#6a6f6a] sm:col-start-auto">
                  Verify the asset, amount and destination encoded in the
                  transaction before relying on interface copy.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-[#d1cec4] bg-[#ece9e1] px-7 py-4 sm:flex-row sm:items-center lg:px-9">
            <p className="font-mono text-[9px] tracking-[0.1em] text-[#656a65]">
              BLOCKCHAIN FACTS → DECODER → RISK RULES → CONTEXT → EXPLANATION
            </p>

            <p className="text-xs text-[#6d726d]">
              AI explains verified facts. It does not determine the risk level.
            </p>
          </div>
        </section>


        <footer className="flex flex-col justify-between gap-5 py-10 text-xs text-[#858984] sm:flex-row">
          <p>PAHAM — Understand before you sign.</p>
          <p>Built on BNB Chain · Indonesia Web3 Hackathon 2026</p>
        </footer>
      </div>
    </main>
  );
}
