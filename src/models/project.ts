import mongoose, { Schema, type InferSchemaType } from "mongoose"

const projectKeySchema = new Schema({
  name: { type: String, required: true, trim: true },
  value: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { _id: true })

const projectMemberSchema = new Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, default: "" },
  role: { type: String, enum: ["read", "write"], default: "read" },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const projectSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  ownerId: { type: String, required: true, index: true },
  ownerEmail: { type: String, required: true },
  visibility: { type: String, enum: ["public", "private"], default: "private" },
  keys: { type: [projectKeySchema], default: [] },
  members: { type: [projectMemberSchema], default: [] },
}, { timestamps: true })

projectSchema.index({ ownerId: 1, createdAt: -1 })
projectSchema.index({ "members.userId": 1 })

export type ProjectDocument = InferSchemaType<typeof projectSchema> & { _id: mongoose.Types.ObjectId }
export const Project = mongoose.models.Project || mongoose.model("Project", projectSchema)
