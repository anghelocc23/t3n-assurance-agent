export const POLICY_VERSION = "2026-09-02.1";

export const EVIDENCE_KINDS = [
  "soc2",
  "penetration_test",
  "iso27001",
  "cyber_insurance",
] as const;

export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type DecisionStatus = "approve" | "review" | "block";

export interface EvidenceSummary {
  kind: EvidenceKind;
  days_remaining: number;
  verified: boolean;
  high_findings: number;
  critical_findings: number;
}

export interface AssuranceRequest {
  vendor_id: string;
  as_of: string;
  annual_spend_usd: number;
  dpa_signed: boolean;
  evidence: EvidenceSummary[];
  /** Human-authored or model-authored context. Deliberately ignored by policy. */
  untrusted_notes?: string;
}

export interface AssuranceDecision {
  decision_id: string;
  vendor_id: string;
  policy_version: string;
  status: DecisionStatus;
  reasons: string[];
  required_actions: string[];
  ignored_untrusted_notes: boolean;
}

const REQUIRED_EVIDENCE: readonly EvidenceKind[] = ["soc2", "penetration_test"];
const EXPIRY_WARNING_DAYS = 45;
const DUAL_APPROVAL_SPEND_USD = 250_000;
const VENDOR_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,63}$/;

function assertInteger(name: string, value: number, minimum = 0): void {
  if (!Number.isInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer >= ${minimum}`);
  }
}

function validateRequest(request: AssuranceRequest): void {
  if (!VENDOR_ID_PATTERN.test(request.vendor_id)) {
    throw new Error("vendor_id must be 3-64 URL-safe characters");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(request.as_of)) {
    throw new Error("as_of must use YYYY-MM-DD");
  }
  assertInteger("annual_spend_usd", request.annual_spend_usd);
  if (!Array.isArray(request.evidence) || request.evidence.length > 16) {
    throw new Error("evidence must contain at most 16 summaries");
  }

  const seen = new Set<EvidenceKind>();
  for (const item of request.evidence) {
    if (!EVIDENCE_KINDS.includes(item.kind)) {
      throw new Error(`unsupported evidence kind: ${String(item.kind)}`);
    }
    if (seen.has(item.kind)) {
      throw new Error(`duplicate evidence kind: ${item.kind}`);
    }
    seen.add(item.kind);
    assertInteger(`${item.kind}.high_findings`, item.high_findings);
    assertInteger(`${item.kind}.critical_findings`, item.critical_findings);
    if (!Number.isInteger(item.days_remaining) || item.days_remaining < -3650 || item.days_remaining > 3650) {
      throw new Error(`${item.kind}.days_remaining is outside the supported range`);
    }
  }
}

function fnv1a64(input: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of Buffer.from(input, "utf8")) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, "0");
}

export function assessVendor(request: AssuranceRequest): AssuranceDecision {
  validateRequest(request);

  const blockReasons: string[] = [];
  const reviewReasons: string[] = [];
  const byKind = new Map(request.evidence.map((item) => [item.kind, item]));

  if (!request.dpa_signed) blockReasons.push("dpa_missing");

  for (const kind of REQUIRED_EVIDENCE) {
    const item = byKind.get(kind);
    if (!item) {
      blockReasons.push(`missing_${kind}`);
      continue;
    }
    if (!item.verified) blockReasons.push(`unverified_${kind}`);
    if (item.days_remaining < 0) blockReasons.push(`expired_${kind}`);
  }

  for (const item of request.evidence) {
    if (item.critical_findings > 0) blockReasons.push(`critical_findings_${item.kind}`);
    if (item.high_findings > 0) reviewReasons.push(`high_findings_${item.kind}`);
    if (item.days_remaining >= 0 && item.days_remaining <= EXPIRY_WARNING_DAYS) {
      reviewReasons.push(`expiring_${item.kind}`);
    }
  }

  const status: DecisionStatus = blockReasons.length > 0
    ? "block"
    : reviewReasons.length > 0
      ? "review"
      : "approve";
  const reasons = status === "block" ? [...blockReasons, ...reviewReasons] : reviewReasons;
  if (reasons.length === 0) reasons.push("all_controls_satisfied");

  const requiredActions = status === "block"
    ? ["remediate_blocking_controls", "rerun_assessment"]
    : status === "review"
      ? ["security_owner_review"]
      : ["record_approval"];

  if (request.annual_spend_usd >= DUAL_APPROVAL_SPEND_USD) {
    requiredActions.push("procurement_dual_approval");
  }

  const fingerprint = JSON.stringify({
    vendor_id: request.vendor_id,
    as_of: request.as_of,
    policy_version: POLICY_VERSION,
    status,
    reasons,
    required_actions: requiredActions,
  });

  return {
    decision_id: `assurance-${fnv1a64(fingerprint)}`,
    vendor_id: request.vendor_id,
    policy_version: POLICY_VERSION,
    status,
    reasons,
    required_actions: requiredActions,
    ignored_untrusted_notes: typeof request.untrusted_notes === "string",
  };
}

