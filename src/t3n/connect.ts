import {
  T3nClient,
  TenantClient,
  createEthAuthInput,
  eth_get_address,
  fetchTrustedManifest,
  getNodeUrl,
  loadWasmComponent,
  metamask_sign,
  setEnvironment,
  type Environment,
} from "@terminal3/t3n-sdk";

export interface ConnectedTenant {
  client: T3nClient;
  tenant: TenantClient;
  did: string;
  environment: Environment;
}

export async function connectTenant(
  keyName = "T3N_API_KEY",
): Promise<ConnectedTenant> {
  const key = process.env[keyName];
  if (!key) {
    throw new Error(`${keyName} is missing; put it in the shell environment, not a file`);
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`${keyName} must be a 0x-prefixed 32-byte key`);
  }

  const environment = (process.env.T3N_ENV ?? "testnet") as Environment;
  if (environment !== "testnet") {
    throw new Error("This challenge project intentionally refuses non-testnet environments");
  }

  setEnvironment(environment);
  const [wasmComponent, trustAnchor] = await Promise.all([
    loadWasmComponent(),
    fetchTrustedManifest(environment),
  ]);
  const address = eth_get_address(key);
  const client = new T3nClient({
    baseUrl: getNodeUrl(),
    trustAnchor,
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(address, undefined, key),
    },
  });

  await client.handshake();
  const authenticated = await client.authenticate(createEthAuthInput(address));
  const did = authenticated.value;
  const tenant = new TenantClient({
    t3n: client,
    baseUrl: getNodeUrl(),
    endpoint: getNodeUrl(),
    environment,
    tenantDid: did,
  });

  return { client, tenant, did, environment };
}

