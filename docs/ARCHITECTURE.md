# Architecture and threat model

## Trust boundary

The source system is responsible for turning reports into normalized summaries. The TEE receives no report body and no vendor contact data. It receives only a vendor identifier, an explicit assessment date, spend tier, DPA state, and bounded evidence summaries.

The TEE contract is the policy and audit boundary. Its WIT imports are intentionally limited to:

- `tenant-context` for the canonical tenant namespace;
- `kv-store` for the tenant-private decision record;
- `logging` for a generic, non-sensitive completion message.

It does not import either HTTP interface. Even a logic defect therefore has no outbound network primitive.

## Decision model

Blocking controls take precedence over review controls. Required SOC 2 and penetration-test evidence must be present, verified, and current. A missing DPA, expired required evidence, or any critical finding blocks. High findings and evidence expiring within 45 days require review. Annual spend of at least USD 250,000 adds dual procurement approval regardless of status.

Free-form notes are not inspected. They are marked as ignored in the result so an operator can see that contextual text was deliberately excluded from the policy path.

## Persistence

`assess-vendor` writes the decision under the validated vendor ID in `z:<tenant>:assurance-decisions`. The deployment creates the map as private and grants both read and write only to the numeric contract ID returned by registration.

`read-decision` exposes the latest decision through the contract boundary; there is no public KV endpoint because the map tail does not use the `public:` prefix.

## Maintenance

Every policy change increments `POLICY_VERSION` in both implementations and adds a matching test. Transport code, input normalization, policy, and TEE persistence remain separate. A future evidence adapter can be replaced without changing the control semantics.

