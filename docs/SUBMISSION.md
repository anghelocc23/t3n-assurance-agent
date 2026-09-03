# Superteam submission — T3N Assurance Agent

## What I built

Assurance Agent is an enterprise third-party-risk gate. It evaluates normalized vendor-security evidence inside a Terminal 3 TEE, produces an auditable `approve` / `review` / `block` decision, and stores the latest result in a tenant-private KV map.

The core design choice is that an LLM never makes or overrides the decision. Free-form notes are treated as untrusted input and ignored by the versioned policy. The contract also imports no HTTP capability, so it has no outbound egress path.

## Why it is useful and maintainable

- Replaces inconsistent spreadsheet reviews with reason-coded policy.
- Enforces evidence verification, expiry, finding severity, DPA, and high-spend dual approval.
- Uses a tiny Rust/WASM contract with three explicit T3N host capabilities.
- Keeps local adapter, policy, T3N connection, and deployment concerns separate.
- Includes strict TypeScript checks, adversarial coverage, Rust unit tests, and a one-command local verification.
- Reads sandbox credentials only from the shell environment and pins the official T3N trust manifest.
- Includes a reproducible report showing that the current sandbox product-page snippet omits the SDK's mandatory attestation trust anchor, plus the safe fix.

## Reproduce

```bash
npm install
npm run verify
```

For the live T3N path:

```bash
rustup target add wasm32-wasip2
cd contract && cargo test && cargo build --target wasm32-wasip2 --release && cd ..
export T3N_API_KEY="<sandbox key>"
npm run t3n:smoke
npm run t3n:deploy
```

## Evidence to attach

- Public GitHub repository URL
- `npm run verify` terminal output
- `npm run evidence` generated decision dashboard and screenshot
- Rust test/build output and WASM component path
- T3N smoke output showing DID, active tenant, and remaining test credits (never the key)
- Deployment output showing canonical contract name, numeric contract ID, version, and first decision
- Screenshots of the above

## Handover

I would like to continue maintaining and operating this agent. If Terminal 3 prefers to host it, the handover is the repository plus the contract tail/version, map ACL procedure, and environment-only credential setup documented above.
