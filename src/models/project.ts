import mongoose, { Schema, type InferSchemaType, Model } from "mongoose";

export enum ProjectAccessLevel {
    READ = "READ",
    WRITE = "WRITE",
}

export enum ProjectVisibility {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
}

export enum ProjectMemberStatus {
    INVITED = "INVITED",
    ACTIVE = "ACTIVE",
}

// 👥 Project members — embedded because the list is bounded and almost always
// read together with the project. userId is nullable to support inviting
// someone by email before they have an account.
const projectMemberSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
        email: { type: String, required: true, lowercase: true, trim: true },
        name: { type: String, default: "" }, // snapshot at invite time; may go stale
        role: { type: String, enum: Object.values(ProjectAccessLevel), default: ProjectAccessLevel.READ },
        status: { type: String, enum: Object.values(ProjectMemberStatus), default: ProjectMemberStatus.INVITED },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

// NOTE: API keys are NOT embedded here, and there's no direct projectId on
// ApiKey either. The relationship is many-to-many via the `ProjectApiKey`
// junction collection (one key can be attached to several projects, and
// vice versa) — see models/project-apikey.ts.
const projectSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 80 },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        ownerEmail: { type: String, required: true, lowercase: true, trim: true },
        visibility: { type: String, enum: Object.values(ProjectVisibility), default: ProjectVisibility.PRIVATE },
        members: { type: [projectMemberSchema], default: [] },
        // Denormalized count of ProjectApiKey rows for this project, so dashboards
        // can show "12 keys" without a count query. Keep in sync via $inc in the
        // attach/detach flows — never write it directly elsewhere.
        keyCount: { type: Number, default: 0, min: 0 },
        // Fork lineage — null for an original project, set for a fork.
        forkedFrom: { type: Schema.Types.ObjectId, ref: "Project", default: null, index: true },
        // Denormalized count of forks of this project, for a "N forks" UI badge.
        // Incremented on the source project whenever someone forks it — never
        // written directly elsewhere.
        forkCount: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

projectSchema.index({ ownerId: 1, createdAt: -1 });
projectSchema.index({ "members.userId": 1 });
projectSchema.index({ "members.email": 1 });
projectSchema.index({ ownerId: 1, visibility: 1 });

// 🧍 Prevent duplicate member emails within a single project
projectSchema.pre("save", function (next) {
    if (this.isModified("members")) {
        const emails = this.members.map((m) => m.email);
        if (new Set(emails).size !== emails.length) {
            return next(new Error("Duplicate member emails are not allowed within a project"));
        }
    }
    next();
});

export type ProjectDocument = InferSchemaType<typeof projectSchema> & {
    _id: mongoose.Types.ObjectId };
export const Project =
    (mongoose.models.Project as Model<ProjectDocument>) ||
    mongoose.model<ProjectDocument>("Project", projectSchema);