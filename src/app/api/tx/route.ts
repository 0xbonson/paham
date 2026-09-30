import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

const client = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("hash");

  if (!hash || !/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return NextResponse.json(
      { error: "Invalid transaction hash" },
      { status: 400 }
    );
  }

  try {
    const tx = await client.getTransaction({
      hash: hash as `0x${string}`,
    });

    return NextResponse.json({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      input: tx.input,
      value: tx.value.toString(),
      blockNumber: tx.blockNumber?.toString() ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Transaction not found on BSC Testnet" },
      { status: 404 }
    );
  }
}
