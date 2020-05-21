import * as expressive from "https://raw.githubusercontent.com/NMathar/deno-express/master/mod.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";
import { LokiService } from "./loki/service.ts";
import { v4 } from "https://deno.land/std/uuid/mod.ts";

const {
  PORT,
  LOKI_HOST,
  LOKI_PORT,
  LOKI_LABEL,
  LOKI_FLUSH_INTERVAL,
  LOKI_FLUSH_MAX_SIZE,
} = config();

(async () => {
  const loki = new LokiService({
    host: LOKI_HOST,
    port: LOKI_PORT,
    labels: {
      gateway: v4.generate(),
      label: LOKI_LABEL,
    },
    flush: {
      interval: Number(LOKI_FLUSH_INTERVAL),
      maxSize: Number(LOKI_FLUSH_MAX_SIZE),
    },
  });

  const app = new expressive.App();
  app.use(expressive.simpleLog());
  app.use(expressive.bodyParser.json());

  app.get("/healthz", async (_, res) => {
    await res.json([{ status: "pass" }]);
  });
  app.post("/log", async (req, res) => {
    loki.log(req.data);
    await res.json([{ status: "ok" }]);
  });

  const server = await app.listen(Number(PORT));
  console.log("App listening on port " + server.port);
})();
