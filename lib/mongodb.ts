// MongoDB connection utility
import mongooseLib from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// Initialize global cache
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

// Cache the connection to avoid multiple connections in development
const cached = global.mongoose;

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongooseLib.connect(MONGODB_URI!, opts).then(() => mongooseLib) as Promise<typeof mongooseLib>;
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
