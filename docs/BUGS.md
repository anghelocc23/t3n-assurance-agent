# T3N SDK / documentation report

## Product-page quickstart omits the required trust anchor

**Observed:** 2026-09-02  
**Page:** `https://terminal3.io/products/agent-developer-kit`  
**SDK:** `@terminal3/t3n-sdk@5.7.0` (current npm `latest` on the observation date)  
**Impact:** copy/pasting the prominent sandbox example fails TypeScript compilation before the first handshake.

### Reproduction

The exact constructor shape shown on the page is preserved in `evidence/product-page-snippet.ts`. From the repository root:

```bash
npx tsc --noEmit --skipLibCheck --target ES2022 \
  --module NodeNext --moduleResolution NodeNext \
  evidence/product-page-snippet.ts
```

Actual compiler result:

```text
error TS2345: Argument of type '{ wasmComponent: WasmComponent; handlers: { EthSign: GuestToHostHandler; }; }'
is not assignable to parameter of type 'T3nClientConfig'.
Property 'trustAnchor' is missing ... but required in type 'T3nClientConfig'.
```

The current SDK correctly makes `T3nClientConfig.trustAnchor` mandatory because it pins the node's DKG attestation. The official developer Quickstart already uses the safe form:

```ts
const client = new T3nClient({
  trustAnchor: await fetchTrustedManifest("sandbox"),
  wasmComponent: await loadWasmComponent(),
  handlers: { EthSign: metamask_sign(address, undefined, key) },
});
```

### Suggested fix

Import `fetchTrustedManifest` in the product-page snippet and add `trustAnchor: await fetchTrustedManifest("sandbox")` to the constructor. Do not replace it with `{ unsafe_trust_server: true }`; that would make a marketing example compile by removing the security property the SDK intentionally enforces.

### Why this is worth fixing

The page promises a five-minute first protected action and is the destination linked directly by the Superteam challenge. It is likely the first code sample a new participant copies. The failure message is technically accurate, but a newcomer has not yet been introduced to attestation manifests and may conclude that the SDK or sandbox is broken.

