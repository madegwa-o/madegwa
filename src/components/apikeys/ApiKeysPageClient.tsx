// components/apikeys/ApiKeysPageClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";
import { formatDate } from "@/lib/format/date";

interface KeySummary {
    _id: string;
    name: string;
    prefix: string;
    lastUsedAt: string | null;
    revoked: boolean;
    expiresAt: string | null;
    createdAt: string;
}

interface ProjectOption {
    _id: string;
    name: string;
}

export function ApiKeysPageClient({
    apiKeys,
    projects,
    isOwner,
}: {
    apiKeys: KeySummary[];
    projects: ProjectOption[];
    isOwner: boolean;
}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    return (
        <div className="mx-auto max-w-4xl px-6 py-8">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-bold">API Keys</h1>
                {isOwner && (
                    <button
                        onClick={() => setOpen(true)}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        New key
                    </button>
                )}
            </div>

            {apiKeys.length === 0 ? (
                <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
                    No API keys yet.
                </div>
            ) : (
                <div className="divide-y divide-border rounded-lg border border-border">
                    {apiKeys.map((k) => (
                        <div key={k._id} className="flex items-center justify-between px-4 py-3">
                            <div>
                                <div className="font-medium">
                                    {k.name}{" "}
                                    {k.revoked && (
                                        <span className="ml-2 rounded-full bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                                            revoked
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {k.prefix}••••••••  ·  created {formatDate(k.createdAt)}
                                    {k.lastUsedAt && `  ·  last used ${formatDate(k.lastUsedAt)}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateApiKeyDialog
                open={open}
                projects={projects}
                onClose={() => setOpen(false)}
                onCreated={() => router.refresh()}
            />
        </div>
    );
}
