import { Activity } from "../models/Activity.js";

export async function recordActivity({ organizationId, boardId = null, cardId = null, actorId, action, metadata = {} }) {
  await Activity.create({
    organizationId,
    boardId,
    cardId,
    actorId,
    action,
    metadata,
  });
}
