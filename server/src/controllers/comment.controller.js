import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import { recordActivity } from "../services/activity.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ cardId: req.card._id }).sort({ createdAt: 1 });
  const authorIds = [...new Set(comments.map((comment) => String(comment.authorId)))];
  const authors = await User.find({ _id: { $in: authorIds } }).select("name email");
  const byId = new Map(authors.map((author) => [String(author._id), author]));
  res.json({
    comments: comments.map((comment) => ({
      ...comment.toJSON(),
      author: byId.get(String(comment.authorId)) || null,
    })),
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const comment = await Comment.create({
    cardId: req.card._id,
    authorId: req.user._id,
    body: req.validated.body.body,
  });
  await recordActivity({
    organizationId: req.board.organizationId,
    boardId: req.board._id,
    cardId: req.card._id,
    actorId: req.user._id,
    action: "comment.added",
    metadata: { title: req.card.title },
  });
  res.status(201).json({
    comment: {
      ...comment.toJSON(),
      author: { _id: req.user._id, name: req.user.name, email: req.user.email },
    },
  });
});
