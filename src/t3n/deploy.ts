import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AssuranceRequest } from "../policy.js";
import { connectTenant } from "./connect.js";

const CONTRACT_TAIL = "vendor-assurance";
const CONTRACT_VERSION = "0.1.0";
const WASM_PATH = resolve("contract/target/wasm32-wasip2/release/z_vendor_assurance.wasm");

const wasm = await readFile(WASM_PATH);
const { client, tenant, did } = await connectTenant();

const registration = await tenant.contracts.register({
  tail: CONTRACT_TAIL,
  version: CONTRACT_VERSION,
  wasm,
});

await tenant.contracts.setDescriptor({
  tail: CONTRACT_TAIL,
  version: CONTRACT_VERSION,
  descriptor: {
    name: "Vendor Assurance",
    summary: "Deterministic vendor-control assessment with tenant-private audit storage.",
    tags: ["security", "procurement", "compliance", "audit"],
    functions: [
      {
        name: "assess-vendor",
        summary: "Assess normalized vendor evidence and persist the decision.",
      },
      {
        name: "read-decision",
        summary: "Read the latest private decision for a vendor.",
      },
    ],
  },
});

try {
  await tenant.maps.create({
    tail: "assurance-decisions",
    visibility: "private",
    writers: { only: [registration.contract_id] },
    readers: { only: [registration.contract_id] },
  });
} catch (error) {
  if (!(error instanceof Error) || !/already exists|MapAlreadyExists/i.test(error.message)) {
    throw error;
  }
}

const sample: AssuranceRequest = {
  vendor_id: "demo-vendor",
  as_of: "2026-09-02",
  annual_spend_usd: 275_000,
  dpa_signed: true,
  evidence: [
    { kind: "soc2", days_remaining: 180, verified: true, high_findings: 0, critical_findings: 0 },
    { kind: "penetration_test", days_remaining: 120, verified: true, high_findings: 0, critical_findings: 0 },
  ],
};

const decision = await tenant.contracts.execute(CONTRACT_TAIL, {
  version: CONTRACT_VERSION,
  functionName: "assess-vendor",
  input: sample,
});
const balance = await client.getBalance();

console.log(JSON.stringify({
  tenant_did: did,
  contract_name: registration.name,
  contract_id: registration.contract_id,
  version: CONTRACT_VERSION,
  decision,
  balance_base_units: balance.available,
}));
