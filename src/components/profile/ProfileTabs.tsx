"use client";

import { useState } from "react";
import type { ProfileProjectSummary, ProfileKeySummary } from "@/lib/profile/data";
import { ProjectCard } from "@/components/profile/ProjectCard";
import { ApiKeyCard } from "@/components/profile/ApiKeyCard";

type Tab = "projects" | "forks" | "keys";

function EmptyState({ message }: { message: string }) {
    return <div className="p-10 text-center text-sm text-muted-foreground">{message}</div>;
}

export function ProfileTabs({
                                displayName,
                                isOwner,
                                projects,
                                forks,
                                apiKeys,
                            }: {
    displayName: string;
    isOwner: boolean;
    projects: ProfileProjectSummary[];
    forks: ProfileProjectSummary[];
    apiKeys: ProfileKeySummary[];
}) {
    const [tab, setTab] = useState<Tab>("projects");

    const tabs: { id: Tab; label: string; count: number }[] = [
        { id: "projects", label: "Projects", count: projects.length },
        { id: "forks", label: "Forks", count: forks.length },
        { id: "keys", label: "API Keys", count: apiKeys.length },
    ];

    return (
        <div>
            <nav className="flex border-b border-border bg-card">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 border-b-2 py-4 text-sm font-semibold transition-colors ${
                            tab === t.id
                                ? "border-primary text-foreground"
                                : "border-transparent text-muted-foreground hover:bg-muted"
                        }`}
                    >
                        {t.label} <span className="font-mono text-xs text-muted-foreground">{t.count}</span>
                    </button>
                ))}
            </nav>

            {tab === "projects" &&
                (projects.length === 0 ? (
                    <EmptyState
                        message={
                            isOwner
                                ? "No projects yet. Create one to start bundling and sharing keys."
                                : `${displayName} hasn't shared any public projects.`
                        }
                    />
                ) : (
                    projects.map((p) => <ProjectCard key={p._id} project={p} />)
                ))}

            {tab === "forks" &&
                (forks.length === 0 ? (
                    <EmptyState message={isOwner ? "You haven't forked any projects yet." : `${displayName} hasn't forked any public projects.`} />
                ) : (
                    forks.map((p) => <ProjectCard key={p._id} project={p} />)
                ))}

            {tab === "keys" &&
                (apiKeys.length === 0 ? (
                    <EmptyState
                        message={
                            isOwner
                                ? "You don't own any keys yet."
                                : `No shared keys — they'll show up here once you're added to one of ${displayName}'s projects.`
                        }
                    />
                ) : (
                    apiKeys.map((k) => <ApiKeyCard key={k._id} apiKey={k} />)
                ))}
        </div>
    );
}