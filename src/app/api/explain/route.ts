import { NextResponse } from "next/server";

type Input = {
  action?: string;
  risk?: string;
  token?: string;
  spender?: string;
  allowance?: string;
  language?: "id" | "en";
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function localFallback(body: Input) {
  const {
    token = "token",
    spender = "unknown spender",
    allowance = "unknown",
    language = "id",
  } = body;

  if (language === "en") {
    return `This request gives ${spender} permission to use ${token} with an allowance of ${allowance}. No tokens need to move at the moment approval is created, but the permission can be used later while it remains active. Verify that you recognize the spender before signing.`;
  }

  return `Permintaan ini memberi alamat ${spender} izin untuk menggunakan ${token} dengan allowance ${allowance}. Token tidak harus langsung berpindah saat approval dibuat, tetapi izin tersebut dapat digunakan kemudian selama masih aktif. Pastikan Anda mengenali alamat yang diberi izin sebelum menandatangani.`;
}

async function callGemini(
  model: string,
  apiKey: string,
  prompt: string
) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 160,
        },
      }),
    }
  );

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      text: await response.text(),
    };
  }

  const data = await response.json();

  const explanation =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!explanation) {
    return {
      ok: false,
      status: 500,
      text: "Empty model response",
    };
  }

  return {
    ok: true,
    status: 200,
    explanation,
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    const body = (await request.json()) as Input;

    const {
      action = "Unknown",
      risk = "Unknown",
      token = "Unknown",
      spender = "Unknown",
      allowance = "Unknown",
      language = "id",
    } = body;

    if (!apiKey) {
      return NextResponse.json({
        explanation: localFallback(body),
        source: "fallback",
      });
    }

    const targetLanguage =
      language === "id" ? "Bahasa Indonesia" : "English";

    const prompt = `
You are PAHAM, a Web3 transaction explanation assistant.

Explain only the deterministic blockchain facts supplied below.
Do not invent scam status, reputation, identity, ownership, or intent.
Never say a transaction is definitely safe or definitely malicious.

Explain for a crypto beginner in ${targetLanguage}.

Facts:
- Action: ${action}
- Risk indicator: ${risk}
- Token: ${token}
- Spender: ${spender}
- Allowance: ${allowance}

Requirements:
- Maximum 3 short sentences.
- Use simple language.
- Explain what permission is granted.
- Explain the practical consequence.
- If risk is HIGH, tell the user to verify the spender before signing.
- ${
  language === "id"
    ? 'Refer to the spender as "alamat yang diberi izin (spender)".'
    : 'Refer to the spender as "spender" or "address receiving permission".'
}
- Do not claim the spender can take more than the available balance.
`;

    const models = [
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ];

    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        const result = await callGemini(
          model,
          apiKey,
          prompt
        );

        if (result.ok) {
          return NextResponse.json({
            explanation: result.explanation,
            source: model,
          });
        }

        const retryable =
          result.status === 429 ||
          result.status === 408 ||
          result.status >= 500;

        if (!retryable) break;

        await sleep(attempt === 0 ? 1200 : 2500);
      }
    }

    return NextResponse.json({
      explanation: localFallback(body),
      source: "fallback",
    });
  } catch {
    return NextResponse.json({
      explanation:
        "AI explanation is temporarily unavailable. The deterministic PAHAM analysis above remains valid.",
      source: "fallback",
    });
  }
}
