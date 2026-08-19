import type { Types } from "mongoose";

/**
 * What the profile page renders. `bio` / `cover` / `location` / `website`
 * are NOT on the User schema yet — they're deliberately typed here as
 * `string | null` rather than assumed present, so the page has an honest
 * empty state today and picking them up later is a one-line change to
 * `toProfileViewModel` below, not a rewrite of any component.
 */
export interface ProfileViewModel {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    cover: string | null;
    location: string | null;
    website: string | null;
    joined: Date;
    lastSeen: Date | null;
}

interface SourceUser {
    _id: Types.ObjectId | string;
    username: string;
    name: string;
    image?: string | null;
    createdAt: Date;
    lastLogin?: Date | null;
    bio: string;
    cover: string;
    location: string | null;
    website: string | null;
}

const FALLBACK_COVER = "https://images.unsplash.com/photo-1518770660439-4636190af475";
const DEFAULT_BIO = "Shipping code, breaking prod, fixing it before anyone notices. Powered by coffee and stack traces.";

export function toProfileViewModel(user: SourceUser): ProfileViewModel {
    return {
        id: String(user._id),
        username: user.username,
        name: user.name,
        avatar: user.image ?? null,
        bio: user.bio ?? DEFAULT_BIO,
        cover: user.cover ?? FALLBACK_COVER,
        location: user.location ?? null,
        website: user.website ?? null,
        joined: user.createdAt,
        lastSeen: user.lastLogin ?? null,
    };
}