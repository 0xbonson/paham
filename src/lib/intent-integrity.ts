export type IntentAction =
  | "claim"
  | "send"
  | "swap"
  | "approve"
  | "transfer"
  | "unknown";

export type IntentDirection =
  | "receive"
  | "send"
  | "permission"
  | "unknown";

export type PermissionKind =
  | "none"
  | "bounded"
  | "unlimited"
  | "operator"
  | "unknown";

export type ExpectedIntent = {
  source: "ui-ai" | "ui-fallback" | "user-confirmed" | "dapp-declared";
  action: IntentAction;
  asset?: string;
  amount?: string;
  direction: IntentDirection;
  permission: PermissionKind;
  rawEvidence: string;
  confidence?: number;
};

export type ActualAuthority = {
  functionName: string;
  asset?: string;
  amount?: string;
  direction: IntentDirection;
  permission: PermissionKind;
  spender?: string;
  recipient?: string;
};

export type IntegrityFinding = {
  code:
    | "ACTION_MISMATCH"
    | "DIRECTION_MISMATCH"
    | "PERMISSION_ESCALATION"
    | "AMOUNT_MISMATCH";
  severity: "info" | "warning" | "critical";
  expected: string;
  actual: string;
  explanation: string;
};

export type IntegrityResult = {
  verdict: "MATCH" | "MISMATCH" | "UNKNOWN";
  findings: IntegrityFinding[];
};

function normalizeAmount(value?: string) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/,/g, "");
}

export function compareIntentToAuthority(
  expected: ExpectedIntent,
  actual: ActualAuthority
): IntegrityResult {
  const findings: IntegrityFinding[] = [];

  if (
    expected.action !== "unknown" &&
    actual.functionName &&
    expected.action !== actual.functionName.toLowerCase()
  ) {
    findings.push({
      code: "ACTION_MISMATCH",
      severity: "critical",
      expected: expected.action,
      actual: actual.functionName,
      explanation:
        "The user-facing action and the contract function are semantically different.",
    });
  }

  if (
    expected.direction !== "unknown" &&
    actual.direction !== "unknown" &&
    expected.direction !== actual.direction
  ) {
    findings.push({
      code: "DIRECTION_MISMATCH",
      severity: "critical",
      expected: expected.direction,
      actual: actual.direction,
      explanation:
        "The expected value flow does not match the authority requested by the transaction.",
    });
  }

  if (
    expected.permission === "none" &&
    actual.permission !== "none" &&
    actual.permission !== "unknown"
  ) {
    findings.push({
      code: "PERMISSION_ESCALATION",
      severity: actual.permission === "unlimited" ? "critical" : "warning",
      expected: "no reusable permission",
      actual: actual.permission,
      explanation:
        "The transaction grants reusable authority even though the visible action did not indicate that permission was expected.",
    });
  }

  const expectedAmount = normalizeAmount(expected.amount);
  const actualAmount = normalizeAmount(actual.amount);

  if (
    expectedAmount &&
    actualAmount &&
    expected.direction === actual.direction &&
    expectedAmount !== actualAmount
  ) {
    findings.push({
      code: "AMOUNT_MISMATCH",
      severity: "warning",
      expected: expected.amount ?? "",
      actual: actual.amount ?? "",
      explanation:
        "The amount encoded by the transaction differs from the amount presented to the user.",
    });
  }

  if (
    expected.action === "unknown" ||
    !actual.functionName ||
    actual.functionName === "unknown"
  ) {
    return {
      verdict: findings.length ? "MISMATCH" : "UNKNOWN",
      findings,
    };
  }

  return {
    verdict: findings.length ? "MISMATCH" : "MATCH",
    findings,
  };
}

export function createIntentReceiptPayload(
  expected: ExpectedIntent,
  actual: ActualAuthority,
  result: IntegrityResult,
  origin: string
) {
  return {
    version: "paham.intent-receipt.v1",
    origin,
    capturedAt: new Date().toISOString(),
    expected,
    actual,
    integrity: result,
  };
}
