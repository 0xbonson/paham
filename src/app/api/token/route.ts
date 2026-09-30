import { NextResponse } from "next/server";
import { createPublicClient, http, parseAbi } from "viem";
import { bscTestnet } from "viem/chains";

const client = createPublicClient({
  chain: bscTestnet,
  transport: http(),
});

const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json(
      { error: "Invalid contract address" },
      { status: 400 }
    );
  }

  try {
    const contractAddress = address as `0x${string}`;

    const [nameResult, symbolResult, decimalsResult] =
      await Promise.allSettled([
        client.readContract({
          address: contractAddress,
          abi: erc20Abi,
          functionName: "name",
        }),

        client.readContract({
          address: contractAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),

        client.readContract({
          address: contractAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ]);

    const name =
      nameResult.status === "fulfilled"
        ? nameResult.value
        : null;

    const symbol =
      symbolResult.status === "fulfilled"
        ? symbolResult.value
        : null;

    const decimals =
      decimalsResult.status === "fulfilled"
        ? Number(decimalsResult.value)
        : null;

    return NextResponse.json({
      address: contractAddress,
      name,
      symbol,
      decimals,
      isERC20:
        name !== null ||
        symbol !== null ||
        decimals !== null,
    });
  } catch {
    return NextResponse.json(
      {
        address,
        name: null,
        symbol: null,
        decimals: null,
        isERC20: false,
      },
      { status: 200 }
    );
  }
}
