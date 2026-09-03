# Local verification record

Recorded on 2026-09-02 before T3N account activation.

## Environment

- Node.js `v24.18.0`
- npm `11.16.0`
- Rust `1.98.0 (88d9e12ae 2026-08-18)`
- T3N SDK `5.7.0`
- Git branch `main`
- Base implementation and bug-report commit `f2540f70d050983fd3b87258cf2bc974561bdcf1`

## Verified commands

`npm run verify`:

- TypeScript strict typecheck: pass
- Node tests: 7 passed, 0 failed
- Demo: approve, review, and block decisions emitted

`cargo test --locked`:

- Rust unit tests: 5 passed, 0 failed
- Rust doctest: 1 passed, 0 failed

`cargo build --locked --target wasm32-wasip2 --release`:

- Release component built successfully
- Path: `contract/target/wasm32-wasip2/release/z_vendor_assurance.wasm`
- Size: 178,588 bytes
- SHA-256: `FF8B3446C7D287482E93DB01DF33C07CC6DC1DB0D50741673A14C7595BA43183`

Credential scan over tracked files:

- No `0x`-prefixed 32-byte private key found
- No `t3n_key_<id>.<secret>` credential found

`npm run evidence`:

- Regenerated the dashboard from the same three executable policy scenarios
- Browser render checked at 1440 × 900
- Screenshot: `evidence/assurance-agent-demo.png`

## Pending live evidence

The following cannot be truthfully recorded until the sandbox account is created and the one-time T3N credential is available:

- authenticated DID
- spendable test-credit balance
- tenant status
- registered canonical contract name and numeric ID
- first TEE decision and private-map readback
