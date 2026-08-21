// app/api/projects/route.ts
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createProject } from "@/lib/DataFetchingFromDb/project/mutations";
import { getProjects } from "@/lib/DataFetchingFromDb/project/profile";
import { ok, unauthorized, badRequest } from "@/lib/api/respond";
import { ProjectVisibility } from "@/models/project";

// GET /api/projects — every project the signed-in user owns
export async function GET() {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const projects = await getProjects({ filter: { ownerId: user.id } });
    return ok({ projects });
}

// POST /api/projects — create a new project
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body?.name || typeof body.name !== "string") {
        return badRequest("Project name is required");
    }

    const visibility =
        body.visibility === ProjectVisibility.PUBLIC ? ProjectVisibility.PUBLIC : ProjectVisibility.PRIVATE;

    try {
        const project = await createProject({
            ownerId: user.id,
            ownerEmail: user.email!,
            name: body.name,
            visibility,
        });
        return ok({ project });
    } catch (error) {
        return badRequest(error instanceof Error ? error.message : "Could not create project");
    }
}
