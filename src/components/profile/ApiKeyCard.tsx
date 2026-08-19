"use client";

import { useState } from "react";
import type { ProfileKeySummary } from "@/lib/profile/data";
import { formatDate } from "@/lib/format/date";

export function ApiKeyCard({ apiKey }: { apiKey: ProfileKeySummary }) {
    const [secret, setSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isExpired = apiKey.expiresAt ? new Date(apiKey.expiresAt) < new Date() : false;

    async function reveal() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/keys/${apiKey._id}/reveal`, { method: "POST" });
            if (!res.ok) {
                setError(res.status === 403 ? "You don't have access to reveal this key." : "Couldn't reveal this key.");
                return;
            }
            const data = await res.json();
            setSecret(data.secret);
        } catch {
            setError("Couldn't reveal this key.");
        } finally {
            setLoading(false);
        }
    }

    async function copy() {
        if (!secret) return;
        await navigator.clipboard.writeText(secret);
    }

    return (
        <div className="border-b border-border p-5">
            <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{apiKey.name}</span>
                {apiKey.revoked && (
                    <span className="rounded-full border border-destructive/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-destructive">
                        Revoked
                    </span>
                )}
                {!apiKey.revoked && isExpired && (
                    <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        Expired
                    </span>
                )}
            </div>

            {apiKey.scopes && apiKey.scopes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {apiKey.scopes.map((scope) => (
                        <span
                            key={scope}
                            className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                        >
                            {scope}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3 flex items-center gap-3">
                <code className="rounded border border-border bg-muted px-2 py-1 font-mono text-xs text-foreground">
                    {secret ?? `${apiKey.prefix}••••••••••••••••••••••••`}
                </code>

                {secret ? (
                    <button
                        onClick={copy}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Copy
                    </button>
                ) : (
                    !apiKey.revoked && (
                        <button
                            onClick={reveal}
                            disabled={loading}
                            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                            {loading ? "Revealing…" : "Reveal"}
                        </button>
                    )
                )}
            </div>

            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

            <div className="mt-3 flex gap-4 font-mono text-xs text-muted-foreground">
                <span>{apiKey.lastUsedAt ? `last used ${formatDate(apiKey.lastUsedAt)}` : "never used"}</span>
                <span>created {formatDate(apiKey.createdAt)}</span>
            </div>
        </div>
    );
}