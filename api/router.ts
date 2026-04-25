import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { networkRouter, deviceRouter, topologyRouter, configRouter, scanRouter } from "./network-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  network: networkRouter,
  device: deviceRouter,
  topology: topologyRouter,
  config: configRouter,
  scan: scanRouter,
});

export type AppRouter = typeof appRouter;
