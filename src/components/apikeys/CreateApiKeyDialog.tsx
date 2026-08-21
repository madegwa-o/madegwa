// components/apikeys/CreateApiKeyDialog.tsx
"use client";

import { useState } from "react";

interface ProjectOption {
    _id: string;
    name: string;
}

export function CreateApiKeyDialog({
    open,
    projects,
    onClose,
    onCreated,
}: {
    open: boolean;
    projects: ProjectOption[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [projectId, setProjectId] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [revealedKey, setRevealedKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, projectId: projectId || undefined }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
                return;
            }
            setRevealedKey(data.rawKey);
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        setName("");
        setProjectId("");
        setRevealedKey(null);
        setCopied(false);
        setError(null);
        onClose();
        if (revealedKey) onCreated(); // only refresh the list once they've seen the secret
    }

    async function copyKey() {
        if (!revealedKey) return;
        await navigator.clipboard.writeText(revealedKey);
        setCopied(true);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
            <div className="glass w-full max-w-md rounded-lg p-6" onClick={(e) => e.stopPropagation()}>
                {revealedKey ? (
                    <>
                        <h2 className="mb-2 text-lg font-semibold">Save your key now</h2>
                        <p className="mb-4 text-sm text-muted-foreground">
                            This is the only time you&apos;ll see the full key, though it&apos;s Stored somewhere safe.
                        </p>
                        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted p-3 font-mono text-sm">
                            <span className="flex-1 break-all">{revealedKey}</span>
                            <button onClick={copyKey} className="shrink-0 text-primary hover:underline">
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleClose}
                                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Done
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="mb-4 text-lg font-semibold">New API key</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm text-muted-foreground">Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={80}
                                    required
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    placeholder="production-key"
                                />
                            </div>
                            {projects.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-sm text-muted-foreground">
                                        Attach to project (optional)
                                    </label>
                                    <select
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">None</option>
                                        {projects.map((p) => (
                                            <option key={p._id} value={p._id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm text-muted-foreground">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                >
                                    {submitting ? "Creating…" : "Create"}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
