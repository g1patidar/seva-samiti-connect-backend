import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    mediaUrl: { type: String, default: "" }, // e.g. /uploads/activities/xxx.jpg or .mp4
    mediaType: { type: String, enum: ["image", "video", ""], default: "" },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    eventDate: { type: Date }, // optional date of activity
  },
  { timestamps: true }
);

const ActivityModel = mongoose.models.Activity || mongoose.model("Activity", activitySchema);

function toSafeActivity(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    title: obj.title,
    description: obj.description || "",
    mediaUrl: obj.mediaUrl || "",
    mediaType: obj.mediaType || "",
    isPublic: Boolean(obj.isPublic),
    eventDate: obj.eventDate || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function createActivity({ title, description, mediaUrl, mediaType, isPublic = true, createdBy, eventDate }) {
  const doc = await ActivityModel.create({
    title: String(title).trim(),
    description: description ? String(description).trim() : "",
    mediaUrl: mediaUrl || "",
    mediaType: mediaType || "",
    isPublic: Boolean(isPublic),
    createdBy: createdBy || undefined,
    eventDate: eventDate ? new Date(eventDate) : undefined,
  });
  return toSafeActivity(doc);
}

export async function listActivities({ limit = 50, publicOnly = true } = {}) {
  const q = publicOnly ? { isPublic: true } : {};
  const docs = await ActivityModel.find(q).sort({ createdAt: -1 }).limit(Number(limit) || 50).lean();
  return docs.map(toSafeActivity);
}

export async function getActivityById(id) {
  const doc = await ActivityModel.findById(id).lean();
  return toSafeActivity(doc);
}

export async function deleteActivity(id) {
  const doc = await ActivityModel.findByIdAndDelete(id).lean();
  return toSafeActivity(doc);
}

export default ActivityModel;
