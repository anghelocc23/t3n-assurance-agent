import { formatTokens } from "@terminal3/t3n-sdk";
import { connectTenant } from "./connect.js";

const { client, tenant, did, environment } = await connectTenant();
const [tenantRecord, balance] = await Promise.all([
  tenant.tenant.me(),
  client.getBalance(),
]);
const tenantStatus = typeof tenantRecord === "object"
  && tenantRecord !== null
  && "status" in tenantRecord
  && typeof tenantRecord.status === "string"
    ? tenantRecord.status
    : "unknown";

console.log(JSON.stringify({
  environment,
  did,
  tenant_status: tenantStatus,
  available_test_credits: formatTokens(balance.available),
  credit_exhausted: balance.credit_exhausted,
}));
