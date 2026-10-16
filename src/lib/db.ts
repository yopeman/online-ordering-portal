import "server-only";

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI ?? process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalForMongoose = globalThis as unknown as {
  __yopeMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__yopeMongoose ??= {
  conn: null,
  promise: null,
});

export class MissingMongoUriError extends Error {
  constructor() {
    super(
      "MONGO_URI is not set. Copy .env.example to .env.local and point it at a running MongoDB instance.",
    );
    this.name = "MissingMongoUriError";
  }
}

/**
 * Connects to MongoDB once per process and reuses the connection on every
 * subsequent call (survives Next.js hot reloads in development).
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGO_URI) throw new MissingMongoUriError();

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(MONGO_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      })
      .then((m) => m)
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export const isMongoConfigured = Boolean(MONGO_URI);