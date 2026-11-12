import mongoose from "mongoose";

export const LABEL_COLORS = ["coral", "teal", "navy", "gold", "olive", "plum"];

const labelSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    color: { type: String, enum: LABEL_COLORS, required: true },
  },
  { timestamps: true },
);

labelSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Label = mongoose.model("Label", labelSchema);
