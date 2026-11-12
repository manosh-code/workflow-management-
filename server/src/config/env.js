import dotenv from "dotenv";

dotenv.config();

function readList(value, fallback) {
  return (value || fallback)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const env = {
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
  get port() {
    return Number(process.env.PORT || 4000);
  },
  get mongoUri() {
    return process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/trello_workflow";
  },
  get jwtSecret() {
    const secret = process.env.JWT_SECRET || "dev-only-change-me";
    if (this.nodeEnv === "production" && secret === "dev-only-change-me") {
      throw new Error("JWT_SECRET must be set in production");
    }
    return secret;
  },
  get jwtExpiresIn() {
    return process.env.JWT_EXPIRES_IN || "7d";
  },
  get corsOrigins() {
    return readList(process.env.CORS_ORIGINS, "http://localhost:5173");
  },
  get bcryptRounds() {
    return Number(process.env.BCRYPT_ROUNDS || 10);
  },
};
