import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getProjects, type ProjectField } from "@/lib/DataFetchingFromDb/project/profile";
import { ProjectMemberStatus } from "@/models/project";
import { ok, unauthorized, parseFields } from "@/lib/api/respond";

// GET /api/projects?fields=name,visibility,keyCount
// "My projects" — owned, or ACTIVE membership. A single $or query rather
// than the batch loaders in lib/relations, since those are built for
// looking this up for many users at once; here there's exactly one.
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const fields = parseFields(req) as ProjectField[] | undefined;
    const projects = await getProjects({
        filter: {
            $or: [
                { ownerId: user.id },
                { members: { $elemMatch: { userId: user.id, status: ProjectMemberStatus.ACTIVE } } },
            ],
        },
        fields,
    });

    return ok({ projects });
}