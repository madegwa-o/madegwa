// components/projects/CreateProjectDialog.tsx
"use client";

import { useState } from "react";

export function CreateProjectDialog({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, visibility }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
                return;
            }
            setName("");
            onCreated();
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="glass w-full max-w-sm rounded-lg p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="mb-4 text-lg font-semibold">New project</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm text-muted-foreground">Name</label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                            placeholder="my-project"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm text-muted-foreground">Visibility</label>
                        <div className="flex gap-2">
                            {(["PRIVATE", "PUBLIC"] as const).map((v) => (
                                <button
                                    type="button"
                                    key={v}
                                    onClick={() => setVisibility(v)}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${
                                        visibility === v
                                            ? "border-primary bg-accent text-accent-foreground"
                                            : "border-border text-muted-foreground"
                                    }`}
                                >
                                    {v === "PRIVATE" ? "Private" : "Public"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground">
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
            </div>
        </div>
    );
}
