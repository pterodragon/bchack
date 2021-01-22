import { GanacheServer } from "@statechannels/devtools";

export default async function globalTeardown() {
  await ((global as any).__GANACHE_SERVER__ as GanacheServer).close();
}
