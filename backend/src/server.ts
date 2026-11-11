import { app } from "./app.js";
import { initialize, db } from "./db.js";
import { secret } from "./middleware/auth.js";
secret();
await initialize();
const server = app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0", () =>
  console.log("Bike Rental API ready on port " + (process.env.PORT ?? 4000)),
);
process.on("SIGTERM", () => server.close(() => void db.$disconnect()));
