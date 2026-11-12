import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (!user || user.tokenVersion !== payload.tv) {
      return next(new ApiError(401, "Authentication required"));
    }
    req.user = user;
    return next();
  } catch {
    return next(new ApiError(401, "Authentication required"));
  }
}
