import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models"
import KeysPanel from "@/components/projects/KeysPanel"
import MembersPanel from "@/components/projects/MembersPanel"

export default async function ProjectPage({
                                              params,
                                          }: {
    params: Promise<{ projectId: string }>
}) {
    const user = await getCurrentUser()
    if (!user) redirect("/auth/login")

    const { projectId } = await params
    await connectToDatabase()

    const project = await Project.findById(projectId).select("-keys.value").lean()
    if (!project) notFound()

    const isOwner = project.ownerId === user.id
    const member = project.members?.find((m) => m.userId === user.id)
    const isMember = isOwner || !!member
    if (!isMember) notFound()

    const canWrite = isOwner || member?.role === "write"

    const keys = (project.keys ?? []).map((k) => ({
        id: k._id.toString(),
        name: k.name,
        createdAt: k.createdAt?.toString() ?? "",
        updatedAt: k.updatedAt?.toString() ?? "",
    }))

    const members = (project.members ?? []).map((m) => ({
        userId: m.userId,
        email: m.email,
        name: m.name ?? "",
        role: m.role as "read" | "write",
    }))

    return (
        <main className="min-h-dvh px-8 py-12 text-foreground lg:px-16">
            <div className="mx-auto max-w-5xl w-full">
                <a href="/dashboard"
                    className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                ← All projects
            </a>

            <header className="mb-10 border-b border-border pb-8">
                <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">
                    {project.visibility === "PUBLIC" ? "Public project" : "Private project"}
                </p>
                <h1 className="text-4xl font-semibold tracking-tight">{project.name}</h1>
            </header>

            <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
                <KeysPanel projectId={projectId} initialKeys={keys} canWrite={canWrite} />
                <MembersPanel
                    projectId={projectId}
                    initialMembers={members}
                    isOwner={isOwner}
                    currentUserId={user.id}
                />
            </div>
        </div>
</main>
)
}