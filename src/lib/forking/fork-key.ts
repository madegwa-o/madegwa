import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Project, ProjectVisibility } from "@/models/project";
import { ApiKey, generateApiKey } from "@/models/apikey";
import { ProjectApiKey } from "@/models/project-apikey";
import { canUserManageProject } from "@/lib/access/projects";
import { ForkNotAllowedError } from "@/lib/forking/errors";
import { uniqueKeyNameForOwner } from "@/lib/forking/unique-name";

interface ForkSingleKeyArgs {
    /** The PUBLIC project the key is being forked *from* — establishes eligibility (#6) and which scopes to copy (a key can carry different scopes per project, #2). */
    sourceProjectId: string;
    sourceApiKeyId: string;
    /** Must already be one of forkingUserId's own projects (owner or WRITE member) — a forked key never lands project-less (#9). */
    targetProjectId: string;
    forkingUserId: string;
}

interface ForkSingleKeyResult {
    key: { id: string; name: string; prefix: string; raw: string; scopes: string[] };
}

/**
 * Design Decisions #9: a key isn't a standalone unit — access control is
 * granted at the project level, so "fork a key" is really "fork this key
 * into one of my own existing projects," using the exact same
 * regenerate-and-mint logic as forkProject. This never creates a
 * project-less key and never auto-creates a throwaway project for it.
 */
export async function forkSingleKey(args: ForkSingleKeyArgs): Promise<ForkSingleKeyResult> {
    const { sourceProjectId, sourceApiKeyId, targetProjectId, forkingUserId } = args;
    await connectToDatabase();

    const sourceProject = await Project.findById(sourceProjectId).select("visibility").lean();
    if (!sourceProject) throw new ForkNotAllowedError("Source project not found");
    if (sourceProject.visibility !== ProjectVisibility.PUBLIC) {
        throw new ForkNotAllowedError("Only keys attached to a PUBLIC project can be forked");
    }

    const link = await ProjectApiKey.findOne({ projectId: sourceProjectId, apiKeyId: sourceApiKeyId })
        .select("scopes")
        .lean();
    if (!link) throw new ForkNotAllowedError("That key isn't attached to that project");

    const sourceKey = await ApiKey.findOne({ _id: sourceApiKeyId, revoked: false }).select("name").lean();
    if (!sourceKey) throw new ForkNotAllowedError("Source key not found or revoked");

    const canManageTarget = await canUserManageProject(forkingUserId, targetProjectId);
    if (!canManageTarget) throw new ForkNotAllowedError("You don't have WRITE access to the target project");

    const session = await mongoose.startSession();
    try {
        let result!: ForkSingleKeyResult;

        await session.withTransaction(async () => {
            const name = await uniqueKeyNameForOwner(forkingUserId, sourceKey.name, session);
            const { raw, prefix, hashedKey, encrypted } = generateApiKey();

            const [newKey] = await ApiKey.create(
                [{ ownerId: forkingUserId, name, prefix, hashedKey, encrypted }],
                { session }
            );
            await ProjectApiKey.create(
                [{ projectId: targetProjectId, apiKeyId: newKey._id, scopes: link.scopes ?? [], addedBy: forkingUserId }],
                { session }
            );
            await Project.updateOne({ _id: targetProjectId }, { $inc: { keyCount: 1 } }, { session });

            result = {
                key: { id: String(newKey._id), name, prefix, raw, scopes: link.scopes ?? [] },
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
}