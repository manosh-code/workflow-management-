import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", default: null },
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card", default: null },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, maxlength: 80 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ cardId: 1, createdAt: -1 });

activitySchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Activity = mongoose.model("Activity", activitySchema);
