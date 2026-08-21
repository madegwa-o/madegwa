import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { forkProject } from "@/lib/forking/fork-project";
import { ForkNotAllowedError } from "@/lib/forking/errors";
import { ok, unauthorized, badRequest } from "@/lib/api/respond";

// POST /api/projects/:projectId/fork
// Returns the new project plus every newly-minted key's raw value, all at
// once — the batch reveal screen from Design Decisions #5. This is the
// only time these raw values are ever returned by the API; the caller
// must show/let the user copy them now.
export async function POST(_req: Request, { params }: { params: { projectId: string } }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    try {
        const result = await forkProject(params.projectId, user.id, user.email);
        return ok(result, 201);
    } catch (err) {
        if (err instanceof ForkNotAllowedError) return badRequest(err.message);
        throw err;
    }
}
