// import { connectToDatabase } from "@/lib/db";
// import { Project, ProjectAccessLevel, ProjectMemberStatus } from "@/models/project";
// import { ProjectApiKey } from "@/models/project-apikey";
// import { getApiKeyById, type ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";
// import { loadApiKeysByOwnerIds, loadApiKeysByProjectIds, loadMemberProjectsByUserIds } from "@/lib/relations/loaders";
//
// /**
//  * The core query of the app: every key a user can see, whether because
//  * they created it or because it's attached to a project they're an ACTIVE
//  * member of. This is what a "my keys" dashboard should call — not
//  * loadApiKeysByOwnerIds alone, which would miss everything shared with them.
//  */
// export async function getApiKeysAccessibleToUser(userId: string, fields?: ApiKeyField[]) {
//     const [ownedMap, memberProjectsMap] = await Promise.all([
//         loadApiKeysByOwnerIds([userId], fields),
//         loadMemberProjectsByUserIds([userId]),
//     ]);
//
//     const projectIds = (memberProjectsMap.get(userId) ?? []).map((p: any) => String(p._id));
//     const sharedMap = await loadApiKeysByProjectIds(projectIds, fields);
//
//     // De-dupe: the same key can reach a user through more than one shared
//     // project, and a key the user owns could theoretically also be
//     // attached to a project they're a member of. Note this collapses
//     // per-project `scopes` to whichever occurrence is merged last — fine
//     // for a flat "all my keys" list, but don't use this for anything that
//     // needs to know scopes-within-a-specific-project (use
//     // loadApiKeysByProjectIds for that instead).
//     const merged = new Map<string, any>();
//     for (const k of ownedMap.get(userId) ?? []) merged.set(String(k._id), k);
//     for (const keys of sharedMap.values()) {
//         for (const k of keys) merged.set(String(k._id), k);
//     }
//     return [...merged.values()];
// }
//
// /**
//  * Authorization check for a single key. Call this BEFORE any read/reveal/
//  * write operation on an API key that isn't already scoped to `ownerId`.
//  *
//  *  - Owner always has full (READ + WRITE) access.
//  *  - Otherwise, the user needs an ACTIVE membership on at least one project
//  *    the key is attached to, with a role that satisfies `requiredRole`.
//  *    READ is satisfied by either READ or WRITE membership; WRITE requires
//  *    WRITE membership specifically.
//  */
// export async function canUserAccessApiKey(
//     userId: string,
//     apiKeyId: string,
//     requiredRole: ProjectAccessLevel = ProjectAccessLevel.READ
// ): Promise<boolean> {
//     await connectToDatabase();
//
//     const key = await getApiKeyById(apiKeyId, ["_id", "ownerId"]);
//     if (!key) return false;
//     if (String(key.ownerId) === userId) return true;
//
//     const links = await ProjectApiKey.find({ apiKeyId }).select("projectId").lean();
//     if (links.length === 0) return false;
//
//     const projectIds = links.map((l) => String(l.projectId));
//     const projects = await Project.find({ _id: { $in: projectIds } }).select("members").lean();
//
//     for (const p of projects) {
//         const member = (p.members ?? []).find(
//             (m: any) => m.userId && String(m.userId) === userId && m.status === ProjectMemberStatus.ACTIVE
//         );
//         if (!member) continue;
//         if (requiredRole === ProjectAccessLevel.READ) return true;
//         if (requiredRole === ProjectAccessLevel.WRITE && member.role === ProjectAccessLevel.WRITE) return true;
//     }
//     return false;
// }

import { connectToDatabase } from "@/lib/db";
import { Project, ProjectAccessLevel, ProjectMemberStatus } from "@/models/project";
import { ProjectApiKey } from "@/models/project-apikey";
import { getApiKeyById, getApiKeys, type ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";
import { loadApiKeysByOwnerIds, loadApiKeysByProjectIds, loadMemberProjectsByUserIds } from "@/lib/relations/loaders";

/**
 * The core query of the app: every key a user can see, whether because
 * they created it or because it's attached to a project they're an ACTIVE
 * member of. This is what a "my keys" dashboard should call — not
 * loadApiKeysByOwnerIds alone, which would miss everything shared with them.
 */
export async function getApiKeysAccessibleToUser(userId: string, fields?: ApiKeyField[]) {
    const [ownedMap, memberProjectsMap] = await Promise.all([
        loadApiKeysByOwnerIds([userId], fields),
        loadMemberProjectsByUserIds([userId]),
    ]);

    const projectIds = (memberProjectsMap.get(userId) ?? []).map((p: any) => String(p._id));
    const sharedMap = await loadApiKeysByProjectIds(projectIds, fields);

    // De-dupe: the same key can reach a user through more than one shared
    // project, and a key the user owns could theoretically also be
    // attached to a project they're a member of. Note this collapses
    // per-project `scopes` to whichever occurrence is merged last — fine
    // for a flat "all my keys" list, but don't use this for anything that
    // needs to know scopes-within-a-specific-project (use
    // loadApiKeysByProjectIds for that instead).
    const merged = new Map<string, any>();
    for (const k of ownedMap.get(userId) ?? []) merged.set(String(k._id), k);
    for (const keys of sharedMap.values()) {
        for (const k of keys) merged.set(String(k._id), k);
    }
    return [...merged.values()];
}

/**
 * For the profile page's "API Keys" tab: keys owned by `ownerId` that
 * `viewerId` is specifically allowed to see. NOT the same as
 * getApiKeysAccessibleToUser(viewerId) filtered down — that would include
 * viewer-owned keys, which don't belong on someone else's profile.
 *
 *  - Own profile: every key you own.
 *  - Anyone else: the intersection — keys `ownerId` owns AND attached to
 *    a project `viewerId` is an ACTIVE member of. A stranger (or a
 *    signed-out visitor) always gets an empty list: owning a key isn't
 *    public information, even if some of the owner's projects are PUBLIC.
 *    Deliberately more conservative than project visibility — see the
 *    design discussion this came out of.
 *  - Signed-out viewer: always empty, short-circuited before any query.
 */
export async function getOwnedApiKeysVisibleToViewer(ownerId: string, viewerId: string | null, fields?: ApiKeyField[]) {
    if (!viewerId) return [];
    if (viewerId === ownerId) {
        return getApiKeys({ filter: { ownerId }, fields });
    }

    const memberProjectsMap = await loadMemberProjectsByUserIds([viewerId]);
    const projectIds = (memberProjectsMap.get(viewerId) ?? []).map((p: any) => String(p._id));
    if (projectIds.length === 0) return [];

    // Always fetch ownerId for the filter below, even if the caller didn't ask for it.
    const projection = fields?.length ? [...new Set([...fields, "ownerId"])] : undefined;
    const byProject = await loadApiKeysByProjectIds(projectIds, projection as ApiKeyField[] | undefined);

    const seen = new Map<string, any>();
    for (const keys of byProject.values()) {
        for (const k of keys) {
            if (String(k.ownerId) === ownerId) seen.set(String(k._id), k);
        }
    }

    let result = [...seen.values()];
    if (fields?.length && !fields.includes("ownerId" as ApiKeyField)) {
        result = result.map(({ ownerId: _drop, ...rest }) => rest);
    }
    return result;
}

/**
 * Authorization check for a single key. Call this BEFORE any read/reveal/
 * write operation on an API key that isn't already scoped to `ownerId`.
 *
 *  - Owner always has full (READ + WRITE) access.
 *  - Otherwise, the user needs an ACTIVE membership on at least one project
 *    the key is attached to, with a role that satisfies `requiredRole`.
 *    READ is satisfied by either READ or WRITE membership; WRITE requires
 *    WRITE membership specifically.
 */
export async function canUserAccessApiKey(
    userId: string,
    apiKeyId: string,
    requiredRole: ProjectAccessLevel = ProjectAccessLevel.READ
): Promise<boolean> {
    await connectToDatabase();

    const key = await getApiKeyById(apiKeyId, ["_id", "ownerId"]);
    if (!key) return false;
    if (String(key.ownerId) === userId) return true;

    const links = await ProjectApiKey.find({ apiKeyId }).select("projectId").lean();
    if (links.length === 0) return false;

    const projectIds = links.map((l) => String(l.projectId));
    const projects = await Project.find({ _id: { $in: projectIds } }).select("members").lean();

    for (const p of projects) {
        const member = (p.members ?? []).find(
            (m: any) => m.userId && String(m.userId) === userId && m.status === ProjectMemberStatus.ACTIVE
        );
        if (!member) continue;
        if (requiredRole === ProjectAccessLevel.READ) return true;
        if (requiredRole === ProjectAccessLevel.WRITE && member.role === ProjectAccessLevel.WRITE) return true;
    }
    return false;
}

/**
 * All ACTIVE collaborators who can see a given key — i.e. every ACTIVE
 * member (any role) of every project the key is attached to, plus the
 * owner. Useful for "who has access to this key" UI.
 */
export async function getCollaboratorsWithAccessToApiKey(apiKeyId: string) {
    await connectToDatabase();

    const key = await getApiKeyById(apiKeyId, ["_id", "ownerId"]);
    if (!key) return [];

    const links = await ProjectApiKey.find({ apiKeyId }).select("projectId").lean();
    const projectIds = links.map((l) => String(l.projectId));
    const projects = await Project.find({ _id: { $in: projectIds } }).select("members ownerId").lean();

    const seen = new Map<string, { userId: string; email: string; role: ProjectAccessLevel }>();
    for (const p of projects) {
        for (const m of p.members ?? []) {
            if (!m.userId || m.status !== ProjectMemberStatus.ACTIVE) continue;
            const uid = String(m.userId);
            const existing = seen.get(uid);
            // If a collaborator has WRITE via any one of the shared projects, surface that.
            if (!existing || (existing.role !== ProjectAccessLevel.WRITE && m.role === ProjectAccessLevel.WRITE)) {
                seen.set(uid, { userId: uid, email: m.email, role: m.role });
            }
        }
    }
    return [...seen.values()];
}