import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    isPublic: { type: Boolean, default: true },
    eventDate: { type: Date }, // optional scheduled/related date
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  },
  { timestamps: true }
);

const AnnouncementModel =
  mongoose.models.Announcement || mongoose.model("Announcement", announcementSchema);

function toSafeAnnouncement(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(obj._id),
    title: obj.title,
    message: obj.message || "",
    isPublic: Boolean(obj.isPublic),
    eventDate: obj.eventDate || null,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}

export async function createAnnouncement({ title, message, isPublic = true, eventDate, createdBy }) {
  const doc = await AnnouncementModel.create({
    title: String(title).trim(),
    message: message ? String(message).trim() : "",
    isPublic: Boolean(isPublic),
    eventDate: eventDate ? new Date(eventDate) : undefined,
    createdBy: createdBy || undefined,
  });
  return toSafeAnnouncement(doc);
}

export async function listAnnouncements({ limit = 50, publicOnly = true } = {}) {
  const q = publicOnly ? { isPublic: true } : {};
  const docs = await AnnouncementModel.find(q).sort({ createdAt: -1 }).limit(Number(limit) || 50).lean();
  return docs.map(toSafeAnnouncement);
}

export async function getAnnouncementById(id) {
  const doc = await AnnouncementModel.findById(id).lean();
  return toSafeAnnouncement(doc);
}

export async function deleteAnnouncement(id) {
  const doc = await AnnouncementModel.findByIdAndDelete(id).lean();
  return toSafeAnnouncement(doc);
}

export default AnnouncementModel;
