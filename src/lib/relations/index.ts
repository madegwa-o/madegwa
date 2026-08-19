import { getUserProfile, type UserProfileField } from "@/lib/DataFetchingFromDb/user/profile";
import { getProjectById, getProjects, type ProjectField } from "@/lib/DataFetchingFromDb/project/profile";
import { getApiKeys, type ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";
import {
    loadOwnedProjectsByUserIds,
    loadMemberProjectsByUserIds,
    loadApiKeysByOwnerIds,
    loadApiKeysByProjectIds,
} from "@/lib/relations/loaders";

/**
 * A route/page describes what it needs as an `include` object. Each key is
 * optional — omit it and that relation just isn't fetched, no wasted
 * queries. This is the one thing to extend when a new relation shows up:
 * add a key here, add a loader in loaders.ts of the same
 * "ids in -> Map<id, docs[]>" shape, wire it in below.
 */

// ---------- user-centric ----------

interface UserGraphInclude {
    ownedProjects?: { fields?: ProjectField[] };
    memberProjects?: { fields?: ProjectField[] };
    apiKeys?: { fields?: ApiKeyField[] };
    /** API keys attached (via junction) to any project the user owns or belongs to. */
    projectApiKeys?: { fields?: ApiKeyField[] };
}

interface UserGraphSpec {
    id: string;
    userFields?: UserProfileField[];
    include?: UserGraphInclude;
}

export async function fetchUserGraph({ id, userFields, include = {} }: UserGraphSpec) {
    const user = await getUserProfile({ by: "id", value: id, fields: userFields });
    if (!user) return null;

    const uid = String(user._id);
    const result: Record<string, unknown> = { user };

    const [ownedMap, memberMap] = await Promise.all([
        include.ownedProjects || include.projectApiKeys
            ? loadOwnedProjectsByUserIds([uid], include.ownedProjects?.fields)
            : Promise.resolve(undefined),
        include.memberProjects || include.projectApiKeys
            ? loadMemberProjectsByUserIds([uid], include.memberProjects?.fields)
            : Promise.resolve(undefined),
    ]);

    if (include.ownedProjects) result.ownedProjects = ownedMap!.get(uid) ?? [];
    if (include.memberProjects) result.memberProjects = memberMap!.get(uid) ?? [];

    if (include.apiKeys) {
        const apiKeyMap = await loadApiKeysByOwnerIds([uid], include.apiKeys.fields);
        result.apiKeys = apiKeyMap.get(uid) ?? [];
    }

    if (include.projectApiKeys) {
        const projectIds = [
            ...(ownedMap!.get(uid) ?? []),
            ...(memberMap!.get(uid) ?? []),
        ].map((p: any) => String(p._id));
        const uniqueProjectIds = [...new Set(projectIds)];
        const byProject = await loadApiKeysByProjectIds(uniqueProjectIds, include.projectApiKeys.fields);
        // Flatten + de-dupe: a key can be attached to more than one of the
        // user's projects, but should show up once in this view.
        const seen = new Map<string, any>();
        for (const keys of byProject.values()) {
            for (const k of keys) seen.set(String(k._id), k);
        }
        result.projectApiKeys = [...seen.values()];
    }

    return result;
}

// ---------- project-centric ----------

interface ProjectGraphInclude {
    apiKeys?: { fields?: ApiKeyField[] };
    /** Owner as a full user profile (beyond the denormalized ownerId/ownerEmail already on the doc). */
    owner?: { fields?: UserProfileField[] };
}

interface ProjectGraphSpec {
    id: string;
    projectFields?: ProjectField[];
    include?: ProjectGraphInclude;
}

export async function fetchProjectGraph({ id, projectFields, include = {} }: ProjectGraphSpec) {
    const project = await getProjectById(id, projectFields);
    if (!project) return null;

    const pid = String(project._id);
    const result: Record<string, unknown> = { project };

    if (include.apiKeys) {
        const byProject = await loadApiKeysByProjectIds([pid], include.apiKeys.fields);
        result.apiKeys = byProject.get(pid) ?? [];
    }

    if (include.owner) {
        const owner = await getUserProfile({ by: "id", value: String(project.ownerId), fields: include.owner.fields });
        result.owner = owner;
    }

    return result;
}

// ---------- multi-project / multi-user cases ----------

/**
 * "API keys shared across these projects" (e.g. a colaborator picking keys
 * that are attached to more than one project they're on) — same loader,
 * just called with several ids and intersected in memory. Cheap because
 * the loader already does the batching; this is just set logic on top.
 */
export async function fetchApiKeysSharedAcrossProjects(projectIds: string[], fields?: ApiKeyField[]) {
    const byProject = await loadApiKeysByProjectIds(projectIds, [...(fields ?? []), "_id"] as ApiKeyField[]);
    const counts = new Map<string, { key: any; count: number }>();
    for (const keys of byProject.values()) {
        for (const k of keys) {
            const kid = String(k._id);
            const entry = counts.get(kid) ?? { key: k, count: 0 };
            entry.count += 1;
            counts.set(kid, entry);
        }
    }
    return [...counts.values()].filter((e) => e.count > 1).map((e) => e.key);
}