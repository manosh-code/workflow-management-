import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
