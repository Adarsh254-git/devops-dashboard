const mongoose = require("mongoose");

/**
 * Prefer MONGODB_URI. Falls back to MONGO_URI for compatibility.
 * Local dev default: mongodb://127.0.0.1:27017/devops-dashboard
 * Docker Compose (backend service): mongodb://database:27017/devops-dashboard
 */
function getMongoUri() {
  return (
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGO_URI?.trim() ||
    "mongodb://127.0.0.1:27017/devops-dashboard"
  );
}

function getConnectionState() {
  if (process.env.SKIP_DB === "true") return "skipped";
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    default:
      return "disconnected";
  }
}

async function connectDatabase() {
  if (process.env.SKIP_DB === "true") {
    console.warn("[db] SKIP_DB=true — MongoDB connection skipped");
    return;
  }

  const uri = getMongoUri();
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log("[db] MongoDB connected");
  } catch (err) {
    const m = String(err.message || err);
    if (/bad auth|authentication failed/i.test(m)) {
      console.error(
        "[db] Auth rejected — MongoDB username/password in your URI do not match a Database User in Atlas.",
      );
      console.error(
        "[db] Fix: Atlas → Database Access → user + password → Connect → Drivers; replace <password> in the URI.",
      );
      console.error(
        "[db] Encode special chars in the password (: @ # / ? % & spaces) using percent-encoding inside the URI.",
      );
      console.error(
        "[db] Use Atlas “Database Users” credentials, not your Atlas account login.",
      );
    }
    throw err;
  }

  mongoose.connection.on("error", (err) => {
    console.error("[db] MongoDB error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[db] MongoDB disconnected");
  });
}

module.exports = {
  mongoose,
  connectDatabase,
  getConnectionState,
  getMongoUri,
};
