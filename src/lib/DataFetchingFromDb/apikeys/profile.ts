import { connectToDatabase } from "@/lib/db";
import { ApiKey, type IApiKey } from "@/models/apikey";
import { decryptSecret } from "@/lib/encryption";

/**
 * `hashedKey` and `encrypted` are deliberately NEVER part of this list.
 * They already have `select: false` on the schema (belt), and this
 * whitelist is the suspenders — even a typo'd field name can't leak them
 * through the dynamic selector below.
 */
const SELECTABLE_FIELDS = [
    "_id",
    "ownerId",
    "name",
    "prefix",
    "lastUsedAt",
    "expiresAt",
    "revoked",
    "revokedAt",
    "createdAt",
    "updatedAt",
] as const;

export type ApiKeyField = (typeof SELECTABLE_FIELDS)[number];

function buildProjection(fields?: readonly ApiKeyField[]): string {
    if (!fields || fields.length === 0) return SELECTABLE_FIELDS.join(" ");
    const safe = fields.filter((f) => (SELECTABLE_FIELDS as readonly string[]).includes(f));
    return safe.length ? safe.join(" ") : "_id";
}

interface SearchArgs {
    filter?: Record<string, unknown>;
    fields?: ApiKeyField[];
    limit?: number;
}

export async function getApiKeys({ filter = {}, fields, limit = 100 }: SearchArgs) {
    await connectToDatabase();
    return ApiKey.find(filter).select(buildProjection(fields)).limit(limit).lean();
}

export async function getApiKeyById(id: string, fields?: ApiKeyField[]) {
    await connectToDatabase();
    return ApiKey.findById(id).select(buildProjection(fields)).lean();
}

/**
 * Reveal the raw secret. Deliberately NOT wired into the generic selector
 * above — this is a separate, narrow function so every call site has to go
 * out of its way to use it, and it's the one place an authorization check
 * belongs (verify the caller is the owner or an authorized project member
 * BEFORE calling this).
 */
export async function revealApiKeySecret(id: string): Promise<string | null> {
    await connectToDatabase();
    const key = await ApiKey.findById(id).select("+encrypted revoked").lean<IApiKey | null>();
    if (!key || key.revoked) return null;
    return decryptSecret(key.encrypted);
}