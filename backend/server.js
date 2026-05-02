const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
/** Register Mongoose models (no active connection required). */
require("./models");

const { connectDatabase } = require("./config/database");
const app = require("./app");

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    await connectDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
