import { connectToDatabase } from "@/lib/db";
import { Project, ProjectMemberStatus } from "@/models/project";
import { ApiKey } from "@/models/apikey";
import { ProjectApiKey } from "@/models/project-apikey";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";
import type { ProjectField } from "@/lib/DataFetchingFromDb/project/profile";

/**
 * Everything here follows one shape: "given N parent ids, return a Map from
 * parent id -> that parent's related docs" in as few queries as possible
 * (one or two, never N+1). This is the only pattern the graph layer needs;
 * new relations are just new functions of this shape, not new abstractions.
 */

function toIdMap<T>(ids: string[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const id of ids) map.set(id, [] as unknown as T[]);
    return map;
}

/** Projects owned by each of the given users. Simple one-to-many, one query. */
export async function loadOwnedProjectsByUserIds(userIds: string[], fields?: ProjectField[]) {
    await connectToDatabase();
    const map = toIdMap<any>(userIds);
    if (userIds.length === 0) return map;
    const projection = fields?.length ? fields.join(" ") : undefined;
    const projects = await Project.find({ ownerId: { $in: userIds } }).select(projection).lean();
    for (const p of projects) {
        const key = String(p.ownerId);
        map.get(key)?.push(p);
    }
    return map;
}

/**
 * Projects each of the given users belongs to as a *member* (embedded
 * array, so it can't be a plain $in on a top-level field the way ownership
 * can — we fetch by array match, then bucket by which member matched).
 *
 * Defaults to ACTIVE members only. An INVITED member hasn't accepted yet —
 * given that project membership is literally the sharing mechanism for API
 * keys, treating an invite as equivalent to access would be a real leak.
 * Pass `includeInvited: true` explicitly for UI that needs to show pending
 * invites themselves (never for anything that gates key visibility).
 */
export async function loadMemberProjectsByUserIds(
    userIds: string[],
    fields?: ProjectField[],
    opts: { includeInvited?: boolean } = {}
) {
    await connectToDatabase();
    const map = toIdMap<any>(userIds);
    if (userIds.length === 0) return map;
    const projection = fields?.length ? [...new Set([...fields, "members"])].join(" ") : undefined;
    const projects = await Project.find({ "members.userId": { $in: userIds } }).select(projection).lean();
    for (const p of projects) {
        for (const m of p.members ?? []) {
            if (!m.userId || !map.has(String(m.userId))) continue;
            if (!opts.includeInvited && m.status !== ProjectMemberStatus.ACTIVE) continue;
            map.get(String(m.userId))!.push(p);
        }
    }
    return map;
}

/** API keys directly owned by each of the given users. One-to-many, one query. */
export async function loadApiKeysByOwnerIds(ownerIds: string[], fields?: ApiKeyField[]) {
    await connectToDatabase();
    const map = toIdMap<any>(ownerIds);
    if (ownerIds.length === 0) return map;
    const projection = fields?.length ? fields.join(" ") : undefined;
    const keys = await ApiKey.find({ ownerId: { $in: ownerIds } }).select(projection).lean();
    for (const k of keys) {
        map.get(String(k.ownerId))?.push(k);
    }
    return map;
}

/**
 * API keys attached to each of the given projects, via the ProjectApiKey
 * junction. Many-to-many, so it's two queries (junction, then $in on
 * ApiKey) instead of one, but still O(1) queries regardless of how many
 * projects or keys are involved.
 *
 * Each returned key has `scopes` merged onto it from the junction row for
 * *that* project — scopes are per-pairing (Design Decisions #2), so the
 * same key can show different scopes depending on which project's list
 * you're looking at. `scopes` is not part of ApiKeyField since it isn't a
 * field on ApiKey itself; it's always included here regardless of `fields`.
 */
export async function loadApiKeysByProjectIds(projectIds: string[], fields?: ApiKeyField[]) {
    await connectToDatabase();
    const map = toIdMap<any>(projectIds);
    if (projectIds.length === 0) return map;

    const links = await ProjectApiKey.find({ projectId: { $in: projectIds } })
        .select("projectId apiKeyId scopes")
        .lean();
    if (links.length === 0) return map;

    const keyIds = [...new Set(links.map((l) => String(l.apiKeyId)))];
    const projection = fields?.length ? fields.join(" ") : undefined;
    const keys = await ApiKey.find({ _id: { $in: keyIds } }).select(projection).lean();
    const keyById = new Map(keys.map((k) => [String(k._id), k]));

    for (const link of links) {
        const key = keyById.get(String(link.apiKeyId));
        if (key) {
            map.get(String(link.projectId))?.push({ ...key, scopes: link.scopes ?? [] });
        }
    }
    return map;
}