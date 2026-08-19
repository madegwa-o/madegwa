import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getApiKeysAccessibleToUser } from "@/lib/access/keys";
import { ok, unauthorized, parseFields } from "@/lib/api/respond";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikey/profile";

// GET /api/keys?fields=name,prefix,lastUsedAt
// "My keys" — everything the signed-in user owns OR can see through active
// membership on a project it's attached to (Design Decisions #3, #12).
// `fields` is optional; the underlying selector whitelists it regardless
// of what's passed, so there's nothing to validate here.
export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const fields = parseFields(req) as ApiKeyField[] | undefined;
    const keys = await getApiKeysAccessibleToUser(user.id, fields);
    return ok({ keys });
}