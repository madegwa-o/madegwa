import mongoose, { Schema, type InferSchemaType, Model } from "mongoose";

// Junction between Project and ApiKey (many-to-many — Design Decisions #1/#2).
// This is the ONLY place that says "this key belongs to this project."
// `scopes` is per-pairing, not per-key: the same physical ApiKey can carry
// different scopes depending on which project it's attached to.
const projectApiKeySchema = new Schema(
    {
        projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
        apiKeyId: { type: Schema.Types.ObjectId, ref: "ApiKey", required: true, index: true },
        scopes: { type: [String], default: [] },
        addedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true, versionKey: false }
);

// One key can't be attached to the same project twice.
projectApiKeySchema.index({ projectId: 1, apiKeyId: 1 }, { unique: true });

export type ProjectApiKeyDocument = InferSchemaType<typeof projectApiKeySchema> & {
    _id: mongoose.Types.ObjectId;
};

export const ProjectApiKey =
    (mongoose.models.ProjectApiKey as Model<ProjectApiKeyDocument>) ||
    mongoose.model<ProjectApiKeyDocument>("ProjectApiKey", projectApiKeySchema);