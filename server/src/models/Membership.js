import mongoose from "mongoose";

export const ROLES = ["admin", "member", "viewer"];

const membershipSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ROLES, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

membershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
membershipSchema.index({ userId: 1 });

membershipSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export const Membership = mongoose.model("Membership", membershipSchema);
