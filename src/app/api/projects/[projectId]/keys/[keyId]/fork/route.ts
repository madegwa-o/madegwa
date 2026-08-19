import { getCurrentUser } from "@/lib/session";
import { forkSingleKey } from "@/lib/forking/fork-key";
import { ForkNotAllowedError } from "@/lib/forking/errors";
import { ok, unauthorized, badRequest } from "@/lib/api/respond";

// POST /api/projects/:projectId/keys/:keyId/fork
// Body: { "targetProjectId": "..." } — one of the caller's own projects
// (owner or WRITE member). :projectId in the URL is the PUBLIC project
// the key is being forked *from* — it fixes which scopes get copied,
// since the same key can carry different scopes per project (#2).
export async function POST(req: Request, { params }: { params: { projectId: string; keyId: string } }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => null);
    const targetProjectId = body?.targetProjectId;
    if (!targetProjectId || typeof targetProjectId !== "string") {
        return badRequest("targetProjectId is required");
    }

    try {
        const result = await forkSingleKey({
            sourceProjectId: params.projectId,
            sourceApiKeyId: params.keyId,
            targetProjectId,
            forkingUserId: user.id,
        });
        return ok(result, 201);
    } catch (err) {
        if (err instanceof ForkNotAllowedError) return badRequest(err.message);
        throw err;
    }
}