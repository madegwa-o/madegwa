// app/api/keys/route.ts
// (add POST alongside your existing GET)
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getApiKeysAccessibleToUser } from "@/lib/access/keys";
import { createApiKeyForUser } from "@/lib/DataFetchingFromDb/apikeys/mutations";
import { ok, unauthorized, badRequest, parseFields } from "@/lib/api/respond";
import type { ApiKeyField } from "@/lib/DataFetchingFromDb/apikeys/profile";

export async function GET(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const fields = parseFields(req) as ApiKeyField[] | undefined;
    const keys = await getApiKeysAccessibleToUser(user.id, fields);
    return ok({ keys });
}

// POST /api/keys — create a new key, optionally attached to a project
export async function POST(req: NextRequest) {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body?.name || typeof body.name !== "string") {
        return badRequest("Key name is required");
    }

    try {
        const { apiKey, rawKey, attached } = await createApiKeyForUser({
            ownerId: user.id,
            name: body.name,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            projectId: body.projectId ?? null,
        });

        // rawKey is only ever sent in THIS response — never persisted in
        // plaintext, never returned again by any other endpoint.
        return ok({ apiKey, rawKey, attached });
    } catch (error) {
        return badRequest(error instanceof Error ? error.message : "Could not create API key");
    }
}
