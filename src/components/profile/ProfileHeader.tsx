import Link from "next/link";
import Image from "next/image";
import type { ProfileViewModel } from "@/lib/profile/view-model";
import { formatDate } from "@/lib/format/date";

function initials(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

export function ProfileHeader({ profile, isOwner }: { profile: ProfileViewModel; isOwner: boolean }) {
    return (
        <div>
            {/* Cover — a quiet gradient when there's no cover image, rather than
                an empty <img> or a stock photo standing in for real content. */}
            <div className="relative h-48 w-full overflow-hidden rounded-lg sm:h-64">
                <Image
                    src={profile.cover} // or just profile.cover if the fallback's already baked into cover by toProfileViewModel
                    alt=""
                    fill
                    className="object-cover"
                    priority
                    sizes="100vw"
                />
            </div>

            <div className="relative bg-card px-6 pb-6 text-card-foreground">
                <div className="flex items-end justify-between">
                    {profile.avatar ? (
                        <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="relative z-10 -mt-16 h-32 w-32 rounded-full border-4 border-background object-cover"
                        />
                    ) : (
                        <div className="relative z-10 -mt-16 flex h-32 w-32 items-center justify-center rounded-full border-4 border-background bg-muted text-3xl font-semibold text-muted-foreground">
                            {initials(profile.name)}
                        </div>
                    )}

                    {isOwner && (
                        <Link
                            href="/settings/profile"
                            className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground hover:bg-muted"
                        >
                            Edit profile
                        </Link>
                    )}
                </div>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>

                    {profile.bio && <p className="mt-4 max-w-2xl text-foreground/90">{profile.bio}</p>}

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        {profile.location && <span>📍 {profile.location}</span>}
                        {profile.website && (
                            <a
                                href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                🔗 {profile.website}
                            </a>
                        )}
                        <span>📅 Joined {formatDate(profile.joined)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}