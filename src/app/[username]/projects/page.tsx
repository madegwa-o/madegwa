// app/[username]/projects/page.tsx
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserProfile } from "@/lib/DataFetchingFromDb/user/profile";
import { getOwnedProjectsVisibleToViewer } from "@/lib/access/projects";
import { ProjectsPageClient } from "@/components/projects/ProjectsPageClient";

export default async function ProjectsPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const viewer = await getCurrentUser();

    const profileUser = await getUserProfile({ by: "username", value: username.toLowerCase(), fields: ["_id", "username"] });
    if (!profileUser) notFound();

    const ownerId = String(profileUser._id);
    const isOwner = viewer?.id === ownerId;

    const projects = await getOwnedProjectsVisibleToViewer(ownerId, viewer?.id ?? null, { forksOnly: false });

    return (
        <ProjectsPageClient
            projects={JSON.parse(JSON.stringify(projects))}
            isOwner={isOwner}
        />
    );
}
