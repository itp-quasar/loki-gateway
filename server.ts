import * as expressive from "https://raw.githubusercontent.com/NMathar/deno-express/master/mod.ts";

const PORT = Deno.env.get("PORT") ?? "8080";
const LABEL = Deno.env.get("LABEL");

(async () => {
  const app = new expressive.App();
  app.use(expressive.bodyParser.json());

  app.get("/healthz", async (_, res) => {
    await res.json([{ status: "pass" }]);
  });
  app.post("/log", async (req, res) => {
    console.log({
      label: LABEL,
      ...req.data,
    });
    await res.json([{ status: "ok" }]);
  });

  const server = await app.listen(Number(PORT));
  console.log("App listening on port " + server.port);
})();
