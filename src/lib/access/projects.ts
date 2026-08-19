// import { connectToDatabase } from "@/lib/db";
// import { Project, ProjectAccessLevel, ProjectMemberStatus, ProjectVisibility } from "@/models/project";
//
// /**
//  * Can this user view the project itself (its metadata + member list)?
//  * PUBLIC projects are viewable by anyone, signed in or not — that's what
//  * makes forking-from-public (#6/#10) work without requiring membership.
//  * PRIVATE projects require being the owner or an ACTIVE member (any role).
//  */
// export async function canUserViewProject(userId: string | null, projectId: string): Promise<boolean> {
//     await connectToDatabase();
//     const project = await Project.findById(projectId).select("ownerId visibility members").lean();
//     if (!project) return false;
//     if (project.visibility === ProjectVisibility.PUBLIC) return true;
//     if (!userId) return false;
//     if (String(project.ownerId) === userId) return true;
//     return (project.members ?? []).some(
//         (m: any) => m.userId && String(m.userId) === userId && m.status === ProjectMemberStatus.ACTIVE
//     );
// }
//
// /**
//  * Can this user perform WRITE-level actions on the project itself —
//  * update its metadata, attach/detach keys, manage members? Per Design
//  * Decisions #12, this is separate from key *visibility*: WRITE gates
//  * actions, not whether a key can be seen.
//  */
// export async function canUserManageProject(userId: string, projectId: string): Promise<boolean> {
//     await connectToDatabase();
//     const project = await Project.findById(projectId).select("ownerId members").lean();
//     if (!project) return false;
//     if (String(project.ownerId) === userId) return true;
//     return (project.members ?? []).some(
//         (m: any) =>
//             m.userId &&
//             String(m.userId) === userId &&
//             m.status === ProjectMemberStatus.ACTIVE &&
//             m.role === ProjectAccessLevel.WRITE
//     );
// }
//


import { connectToDatabase } from "@/lib/db";
import { Project, ProjectAccessLevel, ProjectMemberStatus, ProjectVisibility } from "@/models/project";
import { getProjects, type ProjectField } from "@/lib/DataFetchingFromDb/project/profile";

/**
 * Can this user view the project itself (its metadata + member list)?
 * PUBLIC projects are viewable by anyone, signed in or not — that's what
 * makes forking-from-public (#6/#10) work without requiring membership.
 * PRIVATE projects require being the owner or an ACTIVE member (any role).
 */
export async function canUserViewProject(userId: string | null, projectId: string): Promise<boolean> {
    await connectToDatabase();
    const project = await Project.findById(projectId).select("ownerId visibility members").lean();
    if (!project) return false;
    if (project.visibility === ProjectVisibility.PUBLIC) return true;
    if (!userId) return false;
    if (String(project.ownerId) === userId) return true;
    return (project.members ?? []).some(
        (m: any) => m.userId && String(m.userId) === userId && m.status === ProjectMemberStatus.ACTIVE
    );
}

/**
 * Can this user perform WRITE-level actions on the project itself —
 * update its metadata, attach/detach keys, manage members? Per Design
 * Decisions #12, this is separate from key *visibility*: WRITE gates
 * actions, not whether a key can be seen.
 */
export async function canUserManageProject(userId: string, projectId: string): Promise<boolean> {
    await connectToDatabase();
    const project = await Project.findById(projectId).select("ownerId members").lean();
    if (!project) return false;
    if (String(project.ownerId) === userId) return true;
    return (project.members ?? []).some(
        (m: any) =>
            m.userId &&
            String(m.userId) === userId &&
            m.status === ProjectMemberStatus.ACTIVE &&
            m.role === ProjectAccessLevel.WRITE
    );
}

/**
 * Projects owned by `ownerId`, filtered to what `viewerId` is allowed to
 * see — for the profile page's "Projects"/"Forks" tabs. Deliberately
 * narrower than canUserViewProject: this only ever looks at projects this
 * specific person OWNS (a profile's "Projects" tab is "things they
 * created," same as a GitHub profile's repo list), not projects they're
 * merely a member of.
 *
 *  - Viewing your own profile: every owned project, PUBLIC or PRIVATE.
 *  - Anyone else (including signed-out): PUBLIC only. Being a collaborator
 *    on one of this owner's PRIVATE projects does not surface it here —
 *    that project is visible via its own page/membership, not by browsing
 *    someone else's profile.
 */
export async function getOwnedProjectsVisibleToViewer(
    ownerId: string,
    viewerId: string | null,
    opts: { forksOnly?: boolean } = {},
    fields?: ProjectField[]
) {
    const filter: Record<string, unknown> = {
        ownerId,
        forkedFrom: opts.forksOnly ? { $ne: null } : null,
    };
    if (viewerId !== ownerId) {
        filter.visibility = ProjectVisibility.PUBLIC;
    }
    return getProjects({ filter, fields });
}