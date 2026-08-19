import { connectToDatabase } from "@/lib/db";
import { User, type IUser } from "@/models/user";

/**
 * Everything a caller is EVER allowed to ask for through this dynamic
 * selector. `password`, `emailVerificationToken`, `passwordResetToken`, etc.
 * are intentionally absent — they already have `select: false` on the
 * schema, but we don't rely on that alone. A route can only get back what's
 * in this list, full stop, regardless of what it asks for.
 */
const SELECTABLE_FIELDS = [
    "_id",
    "username",
    "name",
    "email",
    "image",
    "phone",
    "bio",
    "cover",
    "website",
    "location",
    "roles",
    "isActive",
    "lastLogin",
    "createdAt",
    "updatedAt",
    "emailVerified",
    "authProvider",
    "profileCompleted",
] as const;

export type UserProfileField = (typeof SELECTABLE_FIELDS)[number];

export type UserProfile = Pick<IUser, UserProfileField extends keyof IUser ? UserProfileField : never>;

function buildProjection(fields?: readonly UserProfileField[]): string {
    if (!fields || fields.length === 0) return SELECTABLE_FIELDS.join(" ");
    const safe = fields.filter((f) => (SELECTABLE_FIELDS as readonly string[]).includes(f));
    return safe.length ? safe.join(" ") : "_id";
}

interface FindOneArgs {
    by: "id" | "email" | "username";
    value: string;
    fields?: UserProfileField[];
}

/** Fetch a single user, projecting only the fields the caller asked for. */
export async function getUserProfile({ by, value, fields }: FindOneArgs): Promise<UserProfile | null> {
    await connectToDatabase();
    const query = by === "id" ? { _id: value } : { [by]: value };
    return User.findOne(query).select(buildProjection(fields)).lean<UserProfile>();
}

interface FindManyArgs {
    ids: string[];
    fields?: UserProfileField[];
}

/** Batch version — used by the relation layer, but fine to call directly too. */
export async function getUserProfiles({ ids, fields }: FindManyArgs): Promise<UserProfile[]> {
    if (ids.length === 0) return [];
    await connectToDatabase();
    return User.find({ _id: { $in: ids } }).select(buildProjection(fields)).lean<UserProfile[]>();
}

interface SearchArgs {
    filter?: Record<string, unknown>;
    fields?: UserProfileField[];
    limit?: number;
}

/** General-purpose query for listing/searching users (admin screens etc). */
export async function findUserProfiles({ filter = {}, fields, limit = 50 }: SearchArgs): Promise<UserProfile[]> {
    await connectToDatabase();
    return User.find(filter).select(buildProjection(fields)).limit(limit).lean<UserProfile[]>();
}