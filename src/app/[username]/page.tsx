// app/[username]/page.tsx


import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getProfilePageData } from "@/lib/profile/data";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default async function ProfilePage({
                                              params,
                                          }: {
    params: Promise<{ username: string }>;
}) {
    const { username } = await params;

    const viewer = await getCurrentUser();
    const data = await getProfilePageData(username, viewer?.id ?? null);

    if (!data) {
        notFound();
    }

    const { profile, isOwner, projects, forks, apiKeys } = data;

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto max-w-4xl">
                <ProfileHeader profile={profile} isOwner={isOwner} />
                <ProfileStats
                    lastSeen={profile.lastSeen}
                    projectCount={projects.length}
                    forkCount={forks.length}
                    keyCount={apiKeys.length}
                />
            </div>

            <div className="mx-auto max-w-4xl">
                <ProfileTabs
                    displayName={profile.name}
                    isOwner={isOwner}
                    projects={projects}
                    forks={forks}
                    apiKeys={apiKeys}
                />
            </div>
        </main>
    );
}