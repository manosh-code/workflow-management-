import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

const start = async () => {
  await connectDb();
  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server");
  console.error(error instanceof Error ? error.message : "Unknown error");
  process.exit(1);
});
