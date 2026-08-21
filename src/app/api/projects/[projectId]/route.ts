// app/api/projects/[projectId]/route.ts
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { canUserViewProject } from "@/lib/access/projects";
import { fetchProjectGraph } from "@/lib/relations";
import { ok, forbidden, notFound } from "@/lib/api/respond";
import type { ProjectField } from "@/lib/DataFetchingFromDb/project/profile";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";

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
