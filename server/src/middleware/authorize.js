import { Board } from "../models/Board.js";
import { Card } from "../models/Card.js";
import { List } from "../models/List.js";
import { Membership } from "../models/Membership.js";
import { Organization } from "../models/Organization.js";
import { ApiError } from "../utils/ApiError.js";

const RANK = { viewer: 1, member: 2, admin: 3 };

function hasRole(actual, minimum) {
  return (RANK[actual] || 0) >= (RANK[minimum] || 0);
}

export function requireRole(minimum) {
  return (req, _res, next) => {
    if (!req.membership || !hasRole(req.membership.role, minimum)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }
    return next();
  };
}

export function requireActiveBoard(req, _res, next) {
  if (req.board?.archivedAt) {
    return next(new ApiError(409, "Board is archived"));
  }
  return next();
}

export async function loadOrg(req, _res, next) {
  const organization = await Organization.findById(req.params.orgId);
  if (!organization) {
    return next(new ApiError(404, "Resource not found"));
  }
  const membership = await Membership.findOne({
    organizationId: organization._id,
    userId: req.user._id,
  });
  if (!membership) {
    return next(new ApiError(404, "Resource not found"));
  }
  req.organization = organization;
  req.membership = membership;
  return next();
}

export async function loadBoard(req, _res, next) {
  const board = await Board.findById(req.params.boardId);
  if (!board) {
    return next(new ApiError(404, "Resource not found"));
  }
  const membership = await Membership.findOne({
    organizationId: board.organizationId,
    userId: req.user._id,
  });
  if (!membership) {
    return next(new ApiError(404, "Resource not found"));
  }
  req.board = board;
  req.membership = membership;
  return next();
}

export async function loadList(req, _res, next) {
  const list = await List.findById(req.params.listId);
  if (!list) {
    return next(new ApiError(404, "Resource not found"));
  }
  const board = await Board.findById(list.boardId);
  if (!board) {
    return next(new ApiError(404, "Resource not found"));
  }
  const membership = await Membership.findOne({
    organizationId: board.organizationId,
    userId: req.user._id,
  });
  if (!membership) {
    return next(new ApiError(404, "Resource not found"));
  }
  req.list = list;
  req.board = board;
  req.membership = membership;
  return next();
}

export async function loadCard(req, _res, next) {
  const card = await Card.findById(req.params.cardId);
  if (!card) {
    return next(new ApiError(404, "Resource not found"));
  }
  const board = await Board.findById(card.boardId);
  if (!board) {
    return next(new ApiError(404, "Resource not found"));
  }
  const membership = await Membership.findOne({
    organizationId: board.organizationId,
    userId: req.user._id,
  });
  if (!membership) {
    return next(new ApiError(404, "Resource not found"));
  }
  req.card = card;
  req.board = board;
  req.membership = membership;
  return next();
}
