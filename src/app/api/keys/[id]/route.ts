import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { canUserAccessApiKey } from "@/lib/access/keys";
import { getApiKeyById } from "@/lib/DataFetchingFromDb/apikeys/profile";
import { ProjectAccessLevel } from "@/models/project";
import { ok, unauthorized, forbidden, notFound, parseFields } from "@/lib/api/respond";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";

// GET /api/keys/:id?fields=name,prefix
// Metadata only — never the raw secret. See reveal/route.ts for that.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const allowed = await canUserAccessApiKey(user.id, params.id, ProjectAccessLevel.READ);
    if (!allowed) return forbidden();

    const fields = parseFields(req) as ApiKeyField[] | undefined;
    const key = await getApiKeyById(params.id, fields);
    if (!key) return notFound();

    return ok({ key });
}
