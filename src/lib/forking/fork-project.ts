import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Project, ProjectVisibility } from "@/models/project";
import { ApiKey, generateApiKey } from "@/models/apikey";
import { ProjectApiKey } from "@/models/project-apikey";
import { ForkNotAllowedError } from "@/lib/forking/errors";
import { uniqueKeyNameForOwner } from "@/lib/forking/unique-name";

interface MintedKey {
    id: string;
    name: string;
    prefix: string;
    /** Only ever returned here, right after minting. Never stored raw, never returned again. */
    raw: string;
    scopes: string[];
}

interface ForkProjectResult {
    project: {
        id: string;
        name: string;
        visibility: ProjectVisibility;
        forkedFrom: string;
        keyCount: number;
        createdAt: Date;
    };
    keys: MintedKey[];
}

/**
 * Forks `sourceProjectId` for `forkingUserId`. Design Decisions #5-#8:
 *  - source must be PUBLIC (#6); forking never requires membership (#10)
 *  - the fork is always PRIVATE, regardless of the source's visibility,
 *    with no fork-as-public option (#7)
 *  - every attached key is re-minted with a brand-new raw secret — nothing
 *    is copied or decrypted from the original, because the original raw
 *    value was never stored anywhere to copy (#5)
 *  - no back-reference to the source keys is stored — a fork is a
 *    snapshot, not a live pointer; revoking the original never touches
 *    the fork (#8)
 *
 * A key that's since been revoked/deleted is silently skipped rather than
 * failing the whole fork — the fork still succeeds with whatever's left.
 */
export async function forkProject(
    sourceProjectId: string,
    forkingUserId: string,
    forkingUserEmail: string
): Promise<ForkProjectResult> {
    await connectToDatabase();

    const source = await Project.findById(sourceProjectId).lean();
    if (!source) throw new ForkNotAllowedError("Source project not found");
    if (source.visibility !== ProjectVisibility.PUBLIC) {
        throw new ForkNotAllowedError("Only PUBLIC projects can be forked");
    }

    const links = await ProjectApiKey.find({ projectId: sourceProjectId }).select("apiKeyId scopes").lean();
    const sourceKeys = await ApiKey.find({
        _id: { $in: links.map((l) => l.apiKeyId) },
        revoked: false,
    })
        .select("name")
        .lean();
    const sourceKeyById = new Map(sourceKeys.map((k) => [String(k._id), k]));

    const session = await mongoose.startSession();
    try {
        let result!: ForkProjectResult;

        await session.withTransaction(async () => {
            const [newProject] = await Project.create(
                [
                    {
                        name: source.name,
                        ownerId: forkingUserId,
                        ownerEmail: forkingUserEmail,
                        visibility: ProjectVisibility.PRIVATE, // always — #7, non-negotiable
                        members: [],
                        forkedFrom: source._id,
                        keyCount: 0,
                    },
                ],
                { session }
            );

            const mintedKeys: MintedKey[] = [];
            for (const link of links) {
                const sourceKey = sourceKeyById.get(String(link.apiKeyId));
                if (!sourceKey) continue; // revoked/deleted since we looked — skip it

                const name = await uniqueKeyNameForOwner(forkingUserId, sourceKey.name, session);
                const { raw, prefix, hashedKey, encrypted } = generateApiKey();

                const [newKey] = await ApiKey.create(
                    [{ ownerId: forkingUserId, name, prefix, hashedKey, encrypted }],
                    { session }
                );
                await ProjectApiKey.create(
                    [
                        {
                            projectId: newProject._id,
                            apiKeyId: newKey._id,
                            scopes: link.scopes ?? [],
                            addedBy: forkingUserId,
                        },
                    ],
                    { session }
                );

                mintedKeys.push({
                    id: String(newKey._id),
                    name,
                    prefix,
                    raw,
                    scopes: link.scopes ?? [],
                });
            }

            newProject.keyCount = mintedKeys.length;
            await newProject.save({ session });

            // Denormalized counter on the source — see project.ts's own comment: never write elsewhere.
            await Project.updateOne({ _id: source._id }, { $inc: { forkCount: 1 } }, { session });

            result = {
                project: {
                    id: String(newProject._id),
                    name: newProject.name,
                    visibility: newProject.visibility as ProjectVisibility,
                    forkedFrom: String(newProject.forkedFrom),
                    keyCount: newProject.keyCount,
                    createdAt: newProject.createdAt,
                },
                keys: mintedKeys,
            };
        });

        return result;
    } finally {
        await session.endSession();
    }
}