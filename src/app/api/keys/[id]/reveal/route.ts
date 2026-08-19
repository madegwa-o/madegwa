import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { canUserAccessApiKey } from "@/lib/access/keys";
import { revealApiKeySecret } from "@/lib/DataFetchingFromDb/apikeys/profile";
import { ProjectAccessLevel } from "@/models/project";
import { ok, unauthorized, forbidden, notFound } from "@/lib/api/respond";

// POST /api/keys/:id/reveal
// Design Decisions #12: any ACTIVE member of a project the key is attached
// to can reveal it, regardless of READ/WRITE role — role only gates
// actions, not visibility. #13: no audit log by design, so nothing is
// recorded here beyond the access check itself.
// POST (not GET) because this is a sensitive, side-effect-adjacent action —
// keeps it out of browser history, proxies, and access logs that treat
// query strings as loggable.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const allowed = await canUserAccessApiKey(user.id, params.id, ProjectAccessLevel.READ);
    if (!allowed) return forbidden();

    const secret = await revealApiKeySecret(params.id);
    if (secret === null) return notFound();

    return ok({ secret });
}