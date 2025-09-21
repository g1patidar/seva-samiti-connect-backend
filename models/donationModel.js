import mongoose from "mongoose";

/**
 * Counters collection for sequential IDs (atomic increment)
 * Example doc: { _id: "donation", seq: 42 }
 */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});
const CounterModel = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

async function getNextDonationSeq() {
  const doc = await CounterModel.findOneAndUpdate(
    { _id: "donation" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc.seq;
}

function formatDonationId(n, pad = 4) {
  // DN0001, DN0002, ...
  return `DN${String(n).padStart(pad, "0")}`;
}

/**
 * Donation schema
 * Matches prior JSON fields to maintain API compatibility
 */
const DonationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // e.g., "DN0001"
    donor: { type: String, default: "Anonymous", trim: true },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, default: null },
    // Keep as string (YYYY-MM-DD) to maintain behavior with UI formatting
    date: { type: String },
    status: { type: String, default: "Completed" },
    receipt: { type: String },
    userId: { type: String, index: true },
    email: { type: String, index: true },
    isPublic: { type: Boolean, default: true },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

const DonationModel =
  mongoose.models.Donation || mongoose.model("Donation", DonationSchema);

function toPlain(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return obj;
}

export async function getAllDonations() {
  const list = await DonationModel.find({}).sort({ createdAt: -1 }).lean();
  return list.map(toPlain);
}

export async function getDonationById(id) {
  const donation = await DonationModel.findOne({ id: String(id) }).lean();
  return toPlain(donation);
}

export async function createDonation(input) {
  const seq = await getNextDonationSeq();
  const id = formatDonationId(seq);
  const now = new Date();
  const yyyyMmDd = (input?.date && String(input.date)) || now.toISOString().substring(0, 10);
  const receipt =
    (input?.receipt && String(input.receipt)) ||
    `RC_${id}_${now.getFullYear()}.pdf`;

  const doc = await DonationModel.create({
    id,
    donor: input?.donor ?? "Anonymous",
    amount: Number(input?.amount) || 0,
    type: input?.type ?? null,
    date: yyyyMmDd,
    status: input?.status ?? "Completed",
    receipt,
    userId: input?.userId ?? null,
    email: input?.email ?? null,
    isPublic:
      input?.isPublic !== undefined
        ? input.isPublic === true || input.isPublic === "true"
        : true,
    note: input?.note ?? null,
  });

  return toPlain(doc);
}

export async function updateDonation(id, updates) {
  const now = new Date().toISOString();

  const set = {};
  if (updates.hasOwnProperty("donor")) set["donor"] = updates.donor;
  if (updates.hasOwnProperty("amount")) set["amount"] = Number(updates.amount);
  if (updates.hasOwnProperty("type")) set["type"] = updates.type ?? null;
  if (updates.hasOwnProperty("date")) set["date"] = updates.date;
  if (updates.hasOwnProperty("status")) set["status"] = updates.status;
  if (updates.hasOwnProperty("receipt")) set["receipt"] = updates.receipt;
  if (updates.hasOwnProperty("userId")) set["userId"] = updates.userId ?? null;
  if (updates.hasOwnProperty("email")) set["email"] = updates.email ?? null;
  if (updates.hasOwnProperty("isPublic"))
    set["isPublic"] = updates.isPublic === true || updates.isPublic === "true";
  if (updates.hasOwnProperty("note")) set["note"] = updates.note ?? null;

  // updatedAt is automatically handled by timestamps, but ensure set triggers change
  set["updatedAt"] = now;

  const updated = await DonationModel.findOneAndUpdate(
    { id: String(id) },
    { $set: set },
    { new: true }
  ).lean();

  return toPlain(updated);
}

export async function deleteDonation(id) {
  const res = await DonationModel.deleteOne({ id: String(id) });
  return res.deletedCount > 0;
}

export async function getDonationsByUser({ userId, email }) {
  const filter = {};
  if (userId) filter["userId"] = String(userId);
  if (email) filter["email"] = String(email);
  const list = await DonationModel.find(filter).sort({ createdAt: -1 }).lean();
  return list.map(toPlain);
}

export async function getRecentPublicDonations(limit = 10) {
  const lim = Math.max(1, Number(limit) || 10);
  const list = await DonationModel.find({ isPublic: { $ne: false } })
    .sort({ createdAt: -1 })
    .limit(lim)
    .lean();
  return list.map(toPlain);
}

export async function queryDonations({
  type,
  status,
  publicOnly,
  minAmount,
  maxAmount,
}) {
  const filter = {};
  if (type) filter["type"] = String(type);
  if (status) filter["status"] = String(status);
  if (publicOnly === true || publicOnly === "true") filter["isPublic"] = { $ne: false };

  const amount = {};
  if (minAmount !== undefined && minAmount !== null && minAmount !== "") {
    amount["$gte"] = Number(minAmount);
  }
  if (maxAmount !== undefined && maxAmount !== null && maxAmount !== "") {
    amount["$lte"] = Number(maxAmount);
  }
  if (Object.keys(amount).length > 0) {
    filter["amount"] = amount;
  }

  const list = await DonationModel.find(filter).sort({ createdAt: -1 }).lean();
  return list.map(toPlain);
}
