// components/apikeys/CreateApiKeyDialog.tsx
"use client";

import { useState } from "react";

export function CreateApiKeyDialog({
    open,
    onClose,
    onCreated,
}: {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
}) {
    const [name, setName] = useState("");
    const [rawkey, setRawkey] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        setError(null);

        const trimmedName = name.trim();
        const trimmedRawkey = rawkey.trim();

        if (!trimmedName) {
            setError("Key name is required");
            return;
        }

        if (!trimmedRawkey) {
            setError("API key value is required");
            return;
        }

        setSubmitting(true);

        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                    rawkey: trimmedRawkey,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(
                    data.error ??
                        data.message ??
                        "Could not save API key"
                );
                return;
            }

            // Clear the form after successful creation.
            setName("");
            setRawkey("");
            setError(null);

            onCreated();
            onClose();
        } catch {
            setError("Unable to save API key. Please try again.");
        } finally {
            setSubmitting(false);
        }
    }

    function handleClose() {
        if (submitting) return;

        setName("");
        setRawkey("");
        setError(null);

        onClose();
    }

    return (
        <div
            className="
                fixed inset-0 z-50
                flex items-center justify-center
                bg-background/60
                p-4
                backdrop-blur-sm
                font-sans
            "
            onClick={handleClose}
        >
            <div
                className="
                    glass
                    w-full max-w-md
                    rounded-xl
                    p-6
                    text-card-foreground
                    shadow-xl
                "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                        Add API key
                    </h2>

                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Store an API key as a key-value pair.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Key name */}
                    <div className="space-y-2">
                        <label
                            htmlFor="api-key-name"
                            className="
                                block
                                text-sm
                                font-medium
                                text-foreground
                            "
                        >
                            Key
                        </label>

                        <input
                            id="api-key-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={80}
                            required
                            autoFocus
                            placeholder="OPENAI_API_KEY"
                            className="
                                w-full
                                rounded-lg
                                border border-input
                                bg-background/70
                                px-3 py-2.5
                                text-sm
                                font-mono
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

                    {/* API key value */}
                    <div className="space-y-2">
                        <label
                            htmlFor="api-key-value"
                            className="
                                block
                                text-sm
                                font-medium
                                text-foreground
                            "
                        >
                            Value
                        </label>

                        <input
                            id="api-key-value"
                            type="password"
                            value={rawkey}
                            onChange={(e) => setRawkey(e.target.value)}
                            required
                            autoComplete="off"
                            placeholder="sk-..."
                            className="
                                w-full
                                rounded-lg
                                border border-input
                                bg-background/70
                                px-3 py-2.5
                                text-sm
                                font-mono
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
                                leading-relaxed
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
                            onClick={handleClose}
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
                                transition-opacity
                                hover:opacity-90
                                disabled:pointer-events-none
                                disabled:opacity-50
                            "
                        >
                            {submitting ? "Saving…" : "Save API key"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
