import { initialize, db } from "../src/db.js";
import { runTasks } from "../src/services/booking.js";
await initialize();
console.log(await runTasks());
await db.$disconnect();
