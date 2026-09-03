// Verbatim API shape shown on the T3N Sandbox product page on 2026-09-02.
// This file intentionally stays outside tsconfig.json because it demonstrates
// a documentation compile failure against @terminal3/t3n-sdk 5.7.0.
import {
  T3nClient,
  loadWasmComponent,
  setEnvironment,
  createEthAuthInput,
  eth_get_address,
  metamask_sign,
} from "@terminal3/t3n-sdk";

setEnvironment("sandbox");
const key = process.env.T3N_API_KEY!;
const address = eth_get_address(key);

const client = new T3nClient({
  wasmComponent: await loadWasmComponent(),
  handlers: { EthSign: metamask_sign(address, undefined, key) },
});

await client.handshake();
await client.authenticate(createEthAuthInput(address));

