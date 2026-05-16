import { createApp } from "@/app";
import { env } from "@/config/env";

createApp()
  .then((app) => {
    app.listen(Number(env.PORT), () => {
      console.log(`Mindsyncpro API running on ${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server", error);
    process.exit(1);
  });
