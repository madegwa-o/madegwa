// components/projects/ProjectsPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateProjectDialog } from "./CreateProjectDialog";

interface ProjectSummary {
    _id: string;
    name: string;
    visibility: "PUBLIC" | "PRIVATE";
    keyCount: number;
    forkCount: number;
    createdAt: string;
}

export function ProjectsPageClient({ projects, isOwner }: { projects: ProjectSummary[]; isOwner: boolean }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold">Projects</h1>
                {isOwner && (
                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        New project
                    </button>
                )}
            </div>

            {projects.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
                    {isOwner ? "No projects yet — create one to group your API keys." : "No public projects."}
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                    {projects.map((p) => (
                        <div key={p._id} className="rounded-lg border border-border p-4">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold">{p.name}</span>
                                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {p.visibility}
                                </span>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                {p.keyCount} {p.keyCount === 1 ? "key" : "keys"}
                                {p.forkCount > 0 && ` · ${p.forkCount} forks`}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateProjectDialog
                open={open}
                onClose={() => setOpen(false)}
                onCreated={() => {
                    setOpen(false);
                    router.refresh();
                }}
            />
        </div>
    );
}
