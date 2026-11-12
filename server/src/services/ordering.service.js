const GAP = 1024;

export function positionBetween(before, after) {
  if (before == null && after == null) return GAP;
  if (before == null) return after / 2;
  if (after == null) return before + GAP;
  return (before + after) / 2;
}

export async function nextPosition(Model, scopeFilter) {
  const last = await Model.findOne(scopeFilter).sort({ position: -1 }).select("position");
  return last ? last.position + GAP : GAP;
}

export async function rebalance(Model, scopeFilter) {
  const docs = await Model.find(scopeFilter).sort({ position: 1, _id: 1 });
  if (!docs.length) return;
  await Model.bulkWrite(
    docs.map((doc, index) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { position: (index + 1) * GAP } },
      },
    })),
  );
}

export async function positionForIndex(Model, scopeFilter, index, depth = 0) {
  const items = await Model.find(scopeFilter).sort({ position: 1, _id: 1 }).select("position");
  const target = Number.isFinite(index) ? index : items.length;
  const clamped = Math.max(0, Math.min(target, items.length));
  const before = clamped > 0 ? items[clamped - 1].position : null;
  const after = clamped < items.length ? items[clamped].position : null;

  if (before != null && after != null && after - before < 0.0001) {
    if (depth > 1) return before + 0.0001;
    await rebalance(Model, scopeFilter);
    return positionForIndex(Model, scopeFilter, index, depth + 1);
  }

  return positionBetween(before, after);
}

export async function applyOrder(Model, ids) {
  if (!ids.length) return;
  await Model.bulkWrite(
    ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { position: (index + 1) * GAP } },
      },
    })),
  );
}
