process.env.TZ = process.env.TZ || "Asia/Kolkata"; // hospital-local time for all Date math

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const runSeeders = require("./utils/seed");
const autoCompleteDueAppointments = require("./utils/autoCompleteDueAppointments");

const PORT = process.env.PORT || 5000;

const start = async () => { // NOSONAR - top-level await is unavailable in CommonJS modules
  try {
    await connectDB();
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }

  // Seed on startup; non-fatal so a transient seeding error doesn't take the API down
  try {
    await runSeeders();
    console.log("Seeding complete");
  } catch (err) {
    console.error("Startup seeding failed (continuing to start server):", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Periodic sweep for persistent runs; serverless relies on read-path sweeps
  autoCompleteDueAppointments();
  setInterval(autoCompleteDueAppointments, 5 * 60 * 1000).unref();
};

start();
