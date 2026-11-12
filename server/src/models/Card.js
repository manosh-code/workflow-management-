import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    listId: { type: mongoose.Schema.Types.ObjectId, ref: "List", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 5000 },
    position: { type: Number, required: true },
    dueDate: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assigneeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    labelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Label" }],
  },
  { timestamps: true },
);

cardSchema.index({ listId: 1, position: 1 });
cardSchema.index({ boardId: 1, archivedAt: 1 });
cardSchema.index({ title: "text" });

cardSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Card = mongoose.model("Card", cardSchema);
