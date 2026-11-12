import { Activity } from "../models/Activity.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

async function present(activities) {
  const actorIds = [...new Set(activities.map((entry) => String(entry.actorId)))];
  const actors = await User.find({ _id: { $in: actorIds } }).select("name");
  const byId = new Map(actors.map((actor) => [String(actor._id), actor.name]));
  return activities.map((entry) => ({
    ...entry.toJSON(),
    actorName: byId.get(String(entry.actorId)) || "Someone",
  }));
}

export const boardActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ boardId: req.board._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ activities: await present(activities) });
});

export const cardActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ cardId: req.card._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ activities: await present(activities) });
});
