"use client";

import { useState } from "react";

type XRayMode = "raw" | "paham";

type TransactionXRayProps = {
  compact?: boolean;
};

const selector = "095ea7b3";

const spenderWord =
  "000000000000000000000000000000000000000000000000000000000000dead";

const amountWord =
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

export default function TransactionXRay({
  compact = false,
}: TransactionXRayProps) {
  const [mode, setMode] = useState<XRayMode>("paham");

  return (
    <section
      className={`paham-dossier paham-surface xray-shell border border-[#c9c6bd] bg-[#fbfaf5] ${
        compact ? "" : "lg:min-h-[500px]"
      }`}
    >
      <div className="xray-scan" aria-hidden="true" />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-[#d1cec4] bg-[#fbfaf5] px-5 py-4 md:px-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-[#355c67]">
            001
          </span>

          <span className="h-4 w-px bg-[#c9c6bd]" />

          <div>
            <p className="font-mono text-[9px] tracking-[0.14em] text-[#555b56]">
              PAHAM / TRANSACTION X-RAY
            </p>

            <p className="mt-1 font-mono text-[8px] tracking-[0.1em] text-[#949792]">
              ERC-20 APPROVAL SPECIMEN
            </p>
          </div>
        </div>

        <div className="flex border border-[#c8c5bc] bg-[#f1eee6] p-[3px]">
          <button
            type="button"
            aria-pressed={mode === "raw"}
            onClick={() => setMode("raw")}
            className={`px-3 py-1.5 font-mono text-[8px] tracking-[0.1em] transition ${
              mode === "raw"
                ? "bg-[#1b1d1b] text-[#fbfaf5]"
                : "text-[#747974] hover:text-[#1b1d1b]"
            }`}
          >
            RAW
          </button>

          <button
            type="button"
            aria-pressed={mode === "paham"}
            onClick={() => setMode("paham")}
            className={`px-3 py-1.5 font-mono text-[8px] tracking-[0.1em] transition ${
              mode === "paham"
                ? "bg-[#355c67] text-[#fbfaf5]"
                : "text-[#747974] hover:text-[#1b1d1b]"
            }`}
          >
            PAHAM
          </button>
        </div>
      </header>

      {mode === "raw" ? (
        <div key="raw" className="xray-reveal">
          <div
            className={`border-b border-[#d1cec4] ${
              compact ? "p-5" : "p-6 md:p-8"
            }`}
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <p className="font-mono text-[8px] tracking-[0.13em] text-[#8b8f8a]">
                RAW CALLDATA
              </p>

              <p className="font-mono text-[8px] text-[#a0a39e]">
                0x + 3 SEGMENTS
              </p>
            </div>

            <div className="xray-code-block">
              <p className="break-all font-mono text-[11px] leading-7 text-[#787d78] md:text-[12px]">
                <span className="text-[#a2a59f]">0x</span>

                <span className="xray-code-selector">
                  {selector}
                </span>

                <span className="xray-code-spender">
                  {spenderWord}
                </span>

                <span className="xray-code-amount">
                  {amountWord}
                </span>
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3">
            <div className="xray-annotation border-b border-[#d1cec4] p-5 md:border-b-0 md:border-r md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#355c67]">
                  01
                </span>
                <span className="font-mono text-[8px] text-[#92958f]">
                  4 BYTES
                </span>
              </div>

              <p className="mt-7 font-mono text-[10px] tracking-[0.08em] text-[#777b76]">
                FUNCTION SELECTOR
              </p>

              <p className="mt-2 font-mono text-sm font-medium text-[#252925]">
                0x095ea7b3
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-px w-5 bg-[#355c67]" />
                <span className="font-mono text-[9px] text-[#355c67]">
                  approve(address,uint256)
                </span>
              </div>
            </div>

            <div className="xray-annotation border-b border-[#d1cec4] p-5 md:border-b-0 md:border-r md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#355c67]">
                  02
                </span>
                <span className="font-mono text-[8px] text-[#92958f]">
                  ARGUMENT
                </span>
              </div>

              <p className="mt-7 font-mono text-[10px] tracking-[0.08em] text-[#777b76]">
                SPENDER
              </p>

              <p className="mt-2 font-mono text-sm font-medium text-[#252925]">
                0x0000...dEaD
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-px w-5 bg-[#355c67]" />
                <span className="font-mono text-[9px] text-[#777b76]">
                  receives permission
                </span>
              </div>
            </div>

            <div className="xray-annotation p-5 md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#b64a3b]">
                  03
                </span>
                <span className="font-mono text-[8px] text-[#92958f]">
                  ARGUMENT
                </span>
              </div>

              <p className="mt-7 font-mono text-[10px] tracking-[0.08em] text-[#777b76]">
                AMOUNT
              </p>

              <p className="mt-2 font-mono text-sm font-medium text-[#a44236]">
                0xffff...ffff
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="h-px w-5 bg-[#b64a3b]" />
                <span className="font-mono text-[9px] text-[#a44236]">
                  MAX_UINT256
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div key="paham" className="xray-reveal">
          <div
            className={`grid border-b border-[#d1cec4] sm:grid-cols-[.82fr_1fr_1fr] ${
              compact ? "" : "lg:min-h-[225px]"
            }`}
          >
            <div className="border-b border-[#d1cec4] p-5 sm:border-b-0 sm:border-r md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#355c67]">
                  01
                </span>

                <span className="font-mono text-[8px] text-[#969994]">
                  FUNCTION
                </span>
              </div>

              <p className="mt-8 text-xs text-[#777b76]">
                Contract call
              </p>

              <p className="mt-2 font-mono text-[16px] font-medium tracking-[-0.02em]">
                approve()
              </p>

              <p className="mt-5 text-xs leading-5 text-[#777b76]">
                Create or update an ERC-20 token allowance.
              </p>
            </div>

            <div className="border-b border-[#d1cec4] p-5 sm:border-b-0 sm:border-r md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#355c67]">
                  02
                </span>

                <span className="font-mono text-[8px] text-[#969994]">
                  WHO
                </span>
              </div>

              <p className="mt-8 text-xs text-[#777b76]">
                Address given permission
              </p>

              <p className="mt-2 font-mono text-[15px] font-medium">
                0x0000...dEaD
              </p>

              <div className="mt-5 inline-flex items-center gap-2 border border-[#c9c6bd] px-2.5 py-1.5">
                <span className="h-1.5 w-1.5 bg-[#355c67]" />
                <span className="font-mono text-[8px] tracking-[0.08em] text-[#656a65]">
                  SPENDER
                </span>
              </div>
            </div>

            <div className="p-5 md:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] text-[#b64a3b]">
                  03
                </span>

                <span className="font-mono text-[8px] text-[#969994]">
                  PERMISSION
                </span>
              </div>

              <p className="mt-8 text-xs text-[#777b76]">
                Allowance requested
              </p>

              <div className="mt-3 inline-block border border-[#b64a3b]/30 bg-[#b64a3b]/[0.055] px-3 py-2">
                <p className="font-mono text-[13px] font-semibold tracking-[-0.01em] text-[#a44236]">
                  MAX_UINT256
                </p>
              </div>

              <p className="mt-4 font-mono text-[9px] text-[#a44236]">
                interpreted as unlimited
              </p>
            </div>
          </div>

          <div
            className={`relative overflow-hidden ${
              compact ? "p-5" : "p-6 md:p-8"
            }`}
          >
            <div className="absolute bottom-0 left-0 top-0 w-[3px] bg-[#b64a3b]" />

            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="font-mono text-[8px] tracking-[0.14em] text-[#8b8f8a]">
                  HUMAN-READABLE CONSEQUENCE
                </p>

                <p className="mt-3 text-[12px] leading-5 text-[#737873]">
                  Decoded from the calldata above.
                </p>

                <h3
                  className={`mt-2 font-medium tracking-[-0.055em] text-[#a44236] ${
                    compact
                      ? "text-[30px]"
                      : "text-[36px] md:text-[43px]"
                  }`}
                >
                  Unlimited token allowance.
                </h3>
              </div>

              <div className="shrink-0 border border-[#b64a3b]/30 bg-[#b64a3b]/[0.055] px-3 py-2 text-right">
                <p className="font-mono text-[8px] tracking-[0.1em] text-[#a44236]">
                  RISK RULE
                </p>
                <p className="mt-1 font-mono text-[10px] font-semibold text-[#a44236]">
                  HIGH
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="relative z-10 grid grid-cols-3 border-t border-[#d1cec4] bg-[#ece9e1]">
        <div className="border-r border-[#d1cec4] px-3 py-3 text-center">
          <p className="font-mono text-[8px] tracking-[0.09em] text-[#355c67]">
            DECODE
          </p>
        </div>

        <div className="border-r border-[#d1cec4] px-3 py-3 text-center">
          <p className="font-mono text-[8px] tracking-[0.09em] text-[#646964]">
            VERIFY
          </p>
        </div>

        <div className="px-3 py-3 text-center">
          <p className="font-mono text-[8px] tracking-[0.09em] text-[#646964]">
            EXPLAIN
          </p>
        </div>
      </footer>
    </section>
  );
}
