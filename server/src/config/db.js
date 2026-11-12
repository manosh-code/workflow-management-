import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(uri = env.mongoUri) {
  mongoose.set("strictQuery", true);
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
