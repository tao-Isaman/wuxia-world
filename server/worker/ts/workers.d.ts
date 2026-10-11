// The few Cloudflare Workers types the TypeScript half of the server uses
// (server/worker/ts). Declared here so the repo needs no extra type package;
// they follow https://developers.cloudflare.com/workers/runtime-apis/.

declare module "cloudflare:workers" {
  export abstract class WorkerEntrypoint<Env = unknown> {
    protected ctx: ExecutionContext;
    protected env: Env;
    constructor(ctx: ExecutionContext, env: Env);
  }
  export abstract class DurableObject<Env = unknown> {
    protected ctx: DurableObjectState;
    protected env: Env;
    constructor(ctx: DurableObjectState, env: Env);
  }
}

/** The Rust half (worker-build's output, aliased in wrangler.toml). */
declare module "wuxia-rust" {
  const RustWorker: new (ctx: ExecutionContext, env: unknown) => { fetch(request: Request): Promise<Response> };
  export default RustWorker;
  export const AccountObject: unknown;
  export const RoomObject: unknown;
  export const KeyObject: unknown;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}

interface DurableObjectStorage {
  get<T = unknown>(key: string): Promise<T | undefined>;
  get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
  put(key: string, value: unknown): Promise<void>;
  put(entries: Record<string, unknown>): Promise<void>;
  delete(key: string): Promise<boolean>;
  setAlarm(scheduledTime: number): Promise<void>;
  getAlarm(): Promise<number | null>;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectState {
  readonly id: DurableObjectId;
  readonly storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

interface DurableObjectStub {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}
