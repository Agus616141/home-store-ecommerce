import "dotenv/config";
import http from "http";

import { env } from "./config/env.js";
import app from "./app.js";

const httpServer = http.createServer(app);

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Puerto ${env.PORT} en uso. Cerrá la otra instancia del servidor.`);
  } else {
    console.error("Error al iniciar el servidor:", error.message);
  }
  process.exit(1);
});

httpServer.listen(env.PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${env.PORT}`);
});
