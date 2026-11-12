import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { signToken } from "../utils/token.js";

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, "Email is already registered");
  }

  const user = await User.create({
    name,
    email,
    passwordHash: await hashPassword(password),
  });

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password");
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

export const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();
  res.json({ message: "Signed out" });
});
