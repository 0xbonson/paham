import { NextResponse } from "next/server";

type ParsedIntent = {
  action: "claim" | "send" | "swap" | "approve" | "transfer" | "unknown";
  asset?: string;
  amount?: string;
  direction: "receive" | "send" | "permission" | "unknown";
  permission: "none" | "bounded" | "unlimited" | "operator" | "unknown";
  confidence: number;
};

function fallbackParse(visibleText: string): ParsedIntent {
  const text = visibleText.replace(/\s+/g, " ").trim();
  const claim = text.match(/claim\s+([\d,.]+)\s+([A-Za-z0-9_-]+)/i);

  if (claim) {
    return {
      action: "claim",
      amount: claim[1].replace(/,/g, ""),
      asset: claim[2].toUpperCase(),
      direction: "receive",
      permission: "none",
      confidence: 0.7,
    };
  }

  return {
    action: "unknown",
    direction: "unknown",
    permission: "unknown",
    confidence: 0.2,
  };
}

function cleanJson(text: string) {
  return text
    .trim()
    .replace(/^\`\`\`json\s*/i, "")
    .replace(/^\`\`\`\s*/i, "")
    .replace(/\s*\`\`\`$/, "");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { visibleText?: string };
    const visibleText = body.visibleText?.trim();

    if (!visibleText) {
      return NextResponse.json(
        { error: "visibleText is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        intent: fallbackParse(visibleText),
        source: "ui-fallback",
      });
    }

    const prompt = `
You are a UI-intent parser for PAHAM.

Your job is ONLY to convert the user-visible interface text below into structured intent.
Do not assess security, scam status, reputation, maliciousness, or transaction risk.
Do not infer hidden blockchain behavior.
Only extract what the interface appears to tell the user they are trying to do.

Return strict JSON only with this exact shape:
{
  "action": "claim" | "send" | "swap" | "approve" | "transfer" | "unknown",
  "asset": string | null,
  "amount": string | null,
  "direction": "receive" | "send" | "permission" | "unknown",
  "permission": "none" | "bounded" | "unlimited" | "operator" | "unknown",
  "confidence": number
}

Rules:
- "Claim 250 PTT" means action=claim, asset=PTT, amount=250, direction=receive.
- If the visible UI does not mention reusable permission, use permission=none.
- confidence must be between 0 and 1.
- Do not add explanation.

Visible interface text:
${visibleText}
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 180,
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        intent: fallbackParse(visibleText),
        source: "ui-fallback",
      });
    }

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return NextResponse.json({
        intent: fallbackParse(visibleText),
        source: "ui-fallback",
      });
    }

    const parsed = JSON.parse(cleanJson(raw)) as ParsedIntent;

    return NextResponse.json({
      intent: parsed,
      source: "ui-ai",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not parse interface intent" },
      { status: 500 }
    );
  }
}
