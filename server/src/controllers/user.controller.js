import { asyncHandler } from "../utils/asyncHandler.js";

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.validated.body.name;
  await req.user.save();
  res.json({ user: req.user });
});
