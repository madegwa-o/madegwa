import { getUserProfile } from "@/lib/DataFetchingFromDb/user/profile";
import { getOwnedProjectsVisibleToViewer } from "@/lib/access/projects";
import { getOwnedApiKeysVisibleToViewer } from "@/lib/access/keys";
import { toProfileViewModel, type ProfileViewModel } from "@/lib/profile/view-model";

const PROJECT_FIELDS = ["_id", "name", "visibility", "keyCount", "forkCount", "forkedFrom", "updatedAt"] as const;
const KEY_FIELDS = ["_id", "name", "prefix", "lastUsedAt", "revoked", "expiresAt", "createdAt"] as const;

export interface ProfileProjectSummary {
    _id: string;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    keyCount: number;
    forkCount: number;
    forkedFrom: string | null;
    updatedAt: Date;
}

export interface ProfileKeySummary {
    _id: string;
    name: string;
    prefix: string;
    lastUsedAt: Date | null;
    revoked: boolean;
    expiresAt: Date | null;
    createdAt: Date;
    scopes?: string[];
}

export interface ProfilePageData {
    profile: ProfileViewModel;
    isOwner: boolean;
    projects: ProfileProjectSummary[];
    forks: ProfileProjectSummary[];
    apiKeys: ProfileKeySummary[];
}

/**
 * Everything app/[username]/page.tsx needs, in one call. All three lists
 * are already viewer-scoped by the time they get here — the page never
 * has to reason about access control itself, only about rendering.
 */
export async function getProfilePageData(username: string, viewerId: string | null): Promise<ProfilePageData | null> {
    const user = await getUserProfile({
        by: "username",
        value: username.toLowerCase(),
        fields: ["_id", "username", "name", "image", "createdAt", "lastSeen", "bio", "cover", "location", "website"],
    });
    if (!user) return null;

    const ownerId = String(user._id);

    const [projects, forks, apiKeys] = await Promise.all([
        getOwnedProjectsVisibleToViewer(ownerId, viewerId, { forksOnly: false }, [...PROJECT_FIELDS]),
        getOwnedProjectsVisibleToViewer(ownerId, viewerId, { forksOnly: true }, [...PROJECT_FIELDS]),
        getOwnedApiKeysVisibleToViewer(ownerId, viewerId, [...KEY_FIELDS]),
    ]);

    return {
        profile: toProfileViewModel(user),
        isOwner: viewerId === ownerId,
        projects: projects as unknown as ProfileProjectSummary[],
        forks: forks as unknown as ProfileProjectSummary[],
        apiKeys: apiKeys as unknown as ProfileKeySummary[],
    };
}
