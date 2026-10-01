import { Hono } from "hono";
import worker from "./index";
import { registerProtectedLegacyContent } from "./protectedContent";

type AppEnv = Env & {
  AUTH_DB?: D1Database;
  PRIVATE_CONTENT?: R2Bucket;
};

const edge = new Hono<{ Bindings: AppEnv }>();
registerProtectedLegacyContent(edge);

// All non-legacy routes keep using the existing application worker.
edge.all("*", (c) => worker.fetch(c.req.raw, c.env, c.executionCtx));

export default {
  fetch: edge.fetch,
  scheduled(event: ScheduledEvent, env: AppEnv, ctx: ExecutionContext) {
    return worker.scheduled(event, env, ctx);
  },
};
