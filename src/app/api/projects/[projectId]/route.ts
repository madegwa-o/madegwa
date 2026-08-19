// app/api/projects/[projectId]/route.ts
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { canUserViewProject } from "@/lib/access/projects";
import { fetchProjectGraph } from "@/lib/relations";
import { ok, forbidden, notFound } from "@/lib/api/respond";
import type { ProjectField } from "@/lib/DataFetchingFromDb/project/profile";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikey/profile";

// GET /api/projects/:projectId?fields=name,visibility&keyFields=name,prefix,lastUsedAt
// PUBLIC projects are viewable signed-out (canUserViewProject allows a null
// user for those); PRIVATE ones need the caller to be owner or an ACTIVE
// member. Attached keys always come back scoped with their per-project
// `scopes` (see loadApiKeysByProjectIds) — never the raw secret.
//
// Param is `projectId` here — matches the nested
// app/api/projects/[projectId]/keys/[keyId]/fork/route.ts, which Next.js
// requires (sibling dynamic routes under the same path must share the
// same segment name). This is the recommended variant — see below.
export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
    const user = await getCurrentUser();

    const allowed = await canUserViewProject(user?.id ?? null, params.projectId);
    if (!allowed) return forbidden();

    const url = new URL(req.url);
    const projectFields = url.searchParams.get("fields")?.split(",").map((f) => f.trim()) as
        | ProjectField[]
        | undefined;
    const keyFields = url.searchParams.get("keyFields")?.split(",").map((f) => f.trim()) as
        | ApiKeyField[]
        | undefined;

    const graph = await fetchProjectGraph({
        id: params.projectId,
        projectFields,
        include: { apiKeys: { fields: keyFields }, owner: {} },
    });
    if (!graph) return notFound();

    return ok(graph);
}


// POST /api/projects/:id/fork
// Returns the new project plus every newly-minted key's raw value, all at
// once — the batch reveal screen from Design Decisions #5. This is the
// only time these raw values are ever returned by the API; the caller
// must show/let the user copy them now.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    try {
        const result = await forkProject(params.id, user.id, user.email);
        return ok(result, 201);
    } catch (err) {
        if (err instanceof ForkNotAllowedError) return badRequest(err.message);
        throw err;
    }
}