import { app } from "./app.js";
import { initialize, db } from "./db.js";
import { secret } from "./middleware/auth.js";
import { runTasks } from "./services/booking.js";
secret();
await initialize();
await runTasks();
let running = false;
const tasks = setInterval(() => {
  if (running) return;
  running = true;
  void runTasks()
    .catch(() =>
      console.error("Rental tasks failed; will retry in 30 seconds."),
    )
    .finally(() => {
      running = false;
    });
}, 30000);
tasks.unref();
const server = app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0", () =>
  console.log("Bike Rental API ready on port " + (process.env.PORT ?? 4000)),
);
process.on("SIGTERM", () => server.close(() => void db.$disconnect()));
