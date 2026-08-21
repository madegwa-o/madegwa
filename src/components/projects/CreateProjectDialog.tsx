
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
    const [visibility, setVisibility] =
        useState<"PRIVATE" | "PUBLIC">("PRIVATE");
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
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    visibility,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error ?? "Something went wrong");
                return;
            }

            setName("");
            setVisibility("PRIVATE");
            onCreated();
        } catch {
            setError("Unable to create project. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="
                fixed inset-0 z-50
                flex items-center justify-center
                bg-background/60
                backdrop-blur-sm
                p-4
                font-sans
            "
            onClick={onClose}
        >
            <div
                className="
                    glass
                    w-full max-w-sm
                    rounded-xl
                    p-6
                    text-card-foreground
                    shadow-xl
                "
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-5">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        New project
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Create a new project to organize your work.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Project name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="project-name"
                            className="block text-sm font-medium text-foreground"
                        >
                            Name
                        </label>

                        <input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                            autoFocus
                            placeholder="my-project"
                            className="
                                w-full
                                rounded-lg
                                border border-input
                                bg-background/70
                                px-3 py-2.5
                                text-sm
                                text-foreground
                                placeholder:text-muted-foreground
                                outline-none
                                transition
                                focus:border-ring
                                focus:ring-2
                                focus:ring-ring/20
                            "
                        />
                    </div>

                    {/* Visibility */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-foreground">
                            Visibility
                        </label>

                        <div className="flex gap-2">
                            {(["PRIVATE", "PUBLIC"] as const).map((value) => {
                                const selected = visibility === value;

                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() =>
                                            setVisibility(value)
                                        }
                                        className={`
                                            rounded-lg
                                            border
                                            px-3 py-2
                                            text-sm
                                            font-medium
                                            transition-colors
                                            ${
                                                selected
                                                    ? "border-primary bg-accent text-accent-foreground"
                                                    : "border-border bg-background/40 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                                            }
                                        `}
                                    >
                                        {value === "PRIVATE"
                                            ? "Private"
                                            : "Public"}
                                    </button>
                                );
                            })}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {visibility === "PRIVATE"
                                ? "Only you and invited members can access this project."
                                : "Anyone with access to the project can view it."}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div
                            role="alert"
                            className="
                                rounded-lg
                                border border-destructive/30
                                bg-destructive/10
                                px-3 py-2
                                text-sm
                                text-destructive
                            "
                        >
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="
                                rounded-lg
                                px-4 py-2
                                text-sm
                                font-medium
                                text-muted-foreground
                                transition-colors
                                hover:bg-accent
                                hover:text-foreground
                                disabled:pointer-events-none
                                disabled:opacity-50
                            "
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="
                                rounded-lg
                                bg-primary
                                px-4 py-2
                                text-sm
                                font-medium
                                text-primary-foreground
                                shadow-sm
                                transition-opacity
                                hover:opacity-90
                                disabled:pointer-events-none
                                disabled:opacity-50
                            "
                        >
                            {submitting ? "Creating…" : "Create project"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
