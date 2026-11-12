import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    position: { type: Number, required: true },
  },
  { timestamps: true },
);

listSchema.index({ boardId: 1, position: 1 });

listSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const List = mongoose.model("List", listSchema);
