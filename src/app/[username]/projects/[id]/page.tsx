import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import KeysPanel from "@/components/projects/KeysPanel";
import MembersPanel from "@/components/projects/MembersPanel";

export default async function ProjectPage({
                                              params,
                                          }: {
    params: Promise<{ projectId: string }>;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { projectId } = await params;

    const response = await fetch(
        `${process.env.NEXTAUTH_URL}/api/projects/${projectId}`,
        {
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        }
    );

    if (response.status === 404 || response.status === 403) {
        notFound();
    }

    if (!response.ok) {
        throw new Error("Failed to fetch project");
    }

    const data = await response.json();

    const {
        project,
        keys,
        members,
        permissions,
    } = data;

    return (
        <main className="min-h-dvh px-8 py-12 text-foreground lg:px-16">
            <div className="mx-auto w-full max-w-5xl">

                <a
                    href="/dashboard"
                    className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    ← All projects
                </a>

                <header className="mb-10 border-b border-border pb-8">
                    <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">
                        {project.visibility === "PUBLIC"
                            ? "Public project"
                            : "Private project"}
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight">
                        {project.name}
                    </h1>
                </header>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">

                    <KeysPanel
                        projectId={projectId}
                        initialKeys={keys}
                        canWrite={permissions.canWrite}
                    />

                    <MembersPanel
                        projectId={projectId}
                        initialMembers={members}
                        isOwner={permissions.isOwner}
                        currentUserId={user.id}
                    />

                </div>
            </div>
        </main>
    );
}