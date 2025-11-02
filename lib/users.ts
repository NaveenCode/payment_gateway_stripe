// MongoDB user operations
import connectDB from "./mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export interface UserData {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Add a new user to MongoDB
export async function addUser(
  name: string,
  email: string,
  password: string
): Promise<UserData> {
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return {
    id: newUser._id.toString(),
    name: newUser.name,
    email: newUser.email,
    password: newUser.password,
  };
}

// Find user by email
export async function findUserByEmail(email: string): Promise<UserData | null> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
  };
}

// Check if email already exists
export async function emailExists(email: string): Promise<boolean> {
  const user = await User.findOne({ email: email.toLowerCase() });
  return !!user;
}

// Get all users (for debugging)
export async function getAllUsers(): Promise<UserData[]> {
  await connectDB();

  const users = await User.find({});
  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
  }));
}
