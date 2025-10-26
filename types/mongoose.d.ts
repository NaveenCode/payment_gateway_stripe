// TypeScript global type for Mongoose connection caching
import type mongooseType from "mongoose";

declare global {
  var mongoose: {
    conn: typeof mongooseType | null;
    promise: Promise<typeof mongooseType> | null;
  };
}
