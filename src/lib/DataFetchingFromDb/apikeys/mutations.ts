// lib/DataFetchingFromDb/apikeys/mutations.ts
import { connectToDatabase } from "@/lib/db";
import { ApiKey, encodeApiKey } from "@/models/apikey";
import { Project } from "@/models/project";
import { ProjectApiKey } from "@/models/project-apikey";
import { canUserManageProject } from "@/lib/access/projects";

interface CreateApiKeyArgs {
    ownerId: string;
    name: string;
    rawkey: string;
    expiresAt?: Date | null;
  projectId?: string | null; // optionally attach on creation

}

/**
 * Creates a key and returns the RAW secret exactly once. The raw value is
 * never persisted anywhere except the encrypted/hashed forms already on
 * the schema — the caller (API route) must show it to the user now, since
 * it can't be recovered in this form again.
 */
export async function createApiKeyForUser({ ownerId, name,rawkey, expiresAt = null, projectId = null }: CreateApiKeyArgs) {
    await connectToDatabase();

    const trimmed = name.trim();
    if (trimmed.length === 0) {
        throw new Error("Key name is required");
    }
    if (trimmed.length > 80) {
        throw new Error("Key name cannot exceed 80 characters");
    }

    const existing = await ApiKey.findOne({ ownerId, name: trimmed }).select("_id").lean();
    if (existing) {
        throw new Error("You already have a key with this name");
    }

    const { raw, prefix, hashedKey, encrypted } = encodeApiKey(rawkey.trim());

    const apiKey = await ApiKey.create({
        ownerId,
        name: trimmed,
        prefix,
        hashedKey,
        encrypted,
        expiresAt,
    });

    if (projectId) {
        const allowed = await canUserManageProject(ownerId, projectId);
        if (!allowed) {
            // Key still gets created — just not attached. Caller decides
            // whether to surface this as a warning.
            return { apiKey: apiKey.toObject(), rawKey: raw, attached: false };
        }
        await attachApiKeyToProject(projectId, String(apiKey._id));
        return { apiKey: apiKey.toObject(), rawKey: raw, attached: true };
    }

    return { apiKey: apiKey.toObject(), rawKey: raw, attached: false };
}

/**
 * Links a key to a project via the junction collection and keeps the
 * denormalized keyCount in sync. Always go through this — never write
 * ProjectApiKey or bump keyCount directly anywhere else.
 */
export async function attachApiKeyToProject(projectId: string, apiKeyId: string) {
    await connectToDatabase();

    const existing = await ProjectApiKey.findOne({ projectId, apiKeyId }).select("_id").lean();
    if (existing) return; // already attached, no-op

    await ProjectApiKey.create({ projectId, apiKeyId });
    await Project.updateOne({ _id: projectId }, { $inc: { keyCount: 1 } });
}

export async function detachApiKeyFromProject(projectId: string, apiKeyId: string) {
    await connectToDatabase();

    const result = await ProjectApiKey.deleteOne({ projectId, apiKeyId });
    if (result.deletedCount > 0) {
        await Project.updateOne({ _id: projectId, keyCount: { $gt: 0 } }, { $inc: { keyCount: -1 } });
    }
}
