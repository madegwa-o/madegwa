import mongoose, { Schema, type InferSchemaType, Model } from "mongoose"

export enum ProjectRole {
    READ = "READ",
    WRITE = "WRITE",
}

export enum ProjectVisibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}


const projectKeySchema = new Schema({
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, select: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { _id: true })

const projectMemberSchema = new Schema({
    userId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    role: { type: String, enum: ProjectRole, default: ProjectRole.READ },
    createdAt: { type: Date, default: Date.now },
}, { _id: false })

const projectSchema = new Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true },
    visibility: { type: String, enum: ProjectVisibility, default: ProjectVisibility.PRIVATE },
    keys: { type: [projectKeySchema], default: [] },
    members: { type: [projectMemberSchema], default: [] },
}, { timestamps: true })

projectSchema.index({ ownerId: 1, createdAt: -1 })
projectSchema.index({ "members.userId": 1 })

// Prevent duplicate key names within a single project
projectSchema.pre("save", function (next) {
    if (this.isModified("keys")) {
        const names = this.keys.map((k) => k.name)
        if (new Set(names).size !== names.length) {
            return next(new Error("Duplicate key names are not allowed within a project"))
        }
    }
    next()
})

export type ProjectDocument = InferSchemaType<typeof projectSchema> & { _id: mongoose.Types.ObjectId }

export const Project =
    (mongoose.models.Project as Model<ProjectDocument>) ||
    mongoose.model<ProjectDocument>("Project", projectSchema)