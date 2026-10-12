// The Worker's bindings (wrangler.toml) and the names of its Durable Objects.

export interface Env {
  ACCOUNTS: DurableObjectNamespace;
  ROOMS: DurableObjectNamespace;
  KEYS: DurableObjectNamespace;
  WORLD: DurableObjectNamespace;
  BATTLES: DurableObjectNamespace;
  HUBS: DurableObjectNamespace;
  PARTIES: DurableObjectNamespace;
  PBKDF2_ITERATIONS?: string;
}

/**
 * The data generation. Every Durable Object name starts with it (the Rust half
 * uses the same prefix, server/worker/src/lib.rs `DATA_EPOCH`): raising it
 * starts the server over with no accounts, characters, saves or world, and a
 * new signing key (old sessions sign out). Generation 2 began 2026-10-11.
 */
export const DATA_EPOCH = "3";

export const accountObjectName = (username: string) => `${DATA_EPOCH}:${username}`;
export const battleObjectName = (username: string, characterId: string) => `${DATA_EPOCH}:${username}:${characterId}`;
export const WORLD_OBJECT_NAME = `${DATA_EPOCH}:world`;
export const hubObjectName = (username: string) => `${DATA_EPOCH}:hub:${username}`;
export const partyObjectName = (partyId: string) => `${DATA_EPOCH}:party:${partyId}`;
