const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");
const { configureInMemoryModels } = require("./utils/inMemoryModels");

dotenv.config();

const PORT = process.env.PORT || 5000;
let inMemoryDatabase;
let shutdownHooksRegistered = false;

const connectToDatabase = async () => {
  if (mongoose.connection.readyState === 1 || inMemoryDatabase) {
    return;
  }

  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing MONGO_URI environment variable");
  }

  // fix: allow local startup without Mongo by promoting an in-memory model layer when MONGO_URI is absent
  inMemoryDatabase = configureInMemoryModels();
};

const stopDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }

  if (inMemoryDatabase) {
    if (typeof inMemoryDatabase.reset === "function") {
      inMemoryDatabase.reset();
    }
    inMemoryDatabase = undefined;
  }
};

const registerShutdownHooks = () => {
  if (shutdownHooksRegistered) {
    return;
  }

  const handleSignal = async () => {
    await stopDatabase();
    process.exit(0);
  };

  process.once("SIGINT", handleSignal);
  process.once("SIGTERM", handleSignal);
  shutdownHooksRegistered = true;
};

const start = async () => {
  try {
    await connectToDatabase();
    registerShutdownHooks();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = {
  app,
  connectToDatabase,
  start,
  stopDatabase
};
