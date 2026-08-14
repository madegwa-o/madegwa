"use client"

import { useState } from "react"

type KeyRow = {
    id: string
    name: string
    createdAt: string
    updatedAt: string
}

type RevealState = "masked" | "loading" | "revealed" | "error"

export default function KeysPanel({
                                      projectId,
                                      initialKeys,
                                      canWrite,
                                  }: {
    projectId: string
    initialKeys: KeyRow[]
    canWrite: boolean
}) {
    const [keys, setKeys] = useState(initialKeys)
    const [revealState, setRevealState] = useState<Record<string, RevealState>>({})
    const [revealedValue, setRevealedValue] = useState<Record<string, string>>({})
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const [showAdd, setShowAdd] = useState(false)
    const [newName, setNewName] = useState("")
    const [newValue, setNewValue] = useState("")
    const [addError, setAddError] = useState<string | null>(null)
    const [adding, setAdding] = useState(false)

    async function handleReveal(keyId: string) {
        if (revealState[keyId] === "revealed") {
            setRevealState((s) => ({ ...s, [keyId]: "masked" }))
            return
        }

        setRevealState((s) => ({ ...s, [keyId]: "loading" }))

        try {
            const res = await fetch(`/api/projects/${projectId}/keys/${keyId}`)
            if (!res.ok) throw new Error()
            const data = await res.json()
            setRevealedValue((v) => ({ ...v, [keyId]: data.value }))
            setRevealState((s) => ({ ...s, [keyId]: "revealed" }))

            setTimeout(() => {
                setRevealState((s) => (s[keyId] === "revealed" ? { ...s, [keyId]: "masked" } : s))
            }, 20000)
        } catch {
            setRevealState((s) => ({ ...s, [keyId]: "error" }))
        }
    }

    async function handleCopy(keyId: string) {
        const value = revealedValue[keyId]
        if (!value) return
        await navigator.clipboard.writeText(value)
        setCopiedId(keyId)
        setTimeout(() => setCopiedId(null), 1500)
    }

    async function handleDelete(keyId: string) {
        const key = keys.find((k) => k.id === keyId)
        if (!key) return
        if (!confirm(`Delete "${key.name}"? This can't be undone.`)) return

        const res = await fetch(`/api/projects/${projectId}/keys/${keyId}`, { method: "DELETE" })
        if (res.ok) {
            setKeys((k) => k.filter((row) => row.id !== keyId))
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim() || !newValue.trim()) {
            setAddError("Name and value are both required")
            return
        }

        setAdding(true)
        setAddError(null)

        try {
            const res = await fetch(`/api/projects/${projectId}/keys`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName.trim(), value: newValue.trim() }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error ?? "Couldn't add the key")
            }

            const { key } = await res.json()
            setKeys((k) => [...k, { id: key.id, name: key.name, createdAt: key.createdAt, updatedAt: key.createdAt }])
            setNewName("")
            setNewValue("")
            setShowAdd(false)
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Couldn't add the key")
        } finally {
            setAdding(false)
        }
    }

    return (
        <section className="glass rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-medium">Keys</h2>
                {canWrite && (
                    <button
                        onClick={() => setShowAdd((s) => !s)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        {showAdd ? "Cancel" : "Add key"}
                    </button>
                )}
            </div>

            {showAdd && (
                <form
                    onSubmit={handleAdd}
                    className="mb-6 grid gap-3 rounded-md border border-border bg-background/60 backdrop-blur-md p-4"
                >
                    <input
                        placeholder="KEY_NAME"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        className="rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                    />
                    <input
                        placeholder="value"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        type="password"
                        className="rounded-md border border-input bg-background/60 px-3 py-2 font-mono text-sm outline-none ring-primary focus:ring-2"
                    />
                    {addError && <p className="text-sm text-destructive">{addError}</p>}
                    <button
                        type="submit"
                        disabled={adding}
                        className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {adding ? "Saving…" : "Save key"}
                    </button>
                </form>
            )}

            {keys.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No keys stored yet.</p>
            ) : (
                <ul className="divide-y divide-border">
                    {keys.map((key) => {
                        const state = revealState[key.id] ?? "masked"
                        return (
                            <li
                                key={key.id}
                                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                                    <span className="font-medium">{key.name}</span>
                                    <span
                                        className={[
                                            "truncate font-mono text-sm",
                                            state === "revealed" ? "text-foreground" : "text-muted-foreground",
                                            state === "error" ? "text-destructive" : "",
                                        ].join(" ")}
                                    >
                                        {state === "loading" && "Decrypting…"}
                                        {state === "masked" && "••••••••••••••••"}
                                        {state === "error" && "Couldn't decrypt"}
                                        {state === "revealed" && revealedValue[key.id]}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        onClick={() => handleReveal(key.id)}
                                        className="rounded-md border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                    >
                                        {state === "revealed" ? "Hide" : "Reveal"}
                                    </button>
                                    {state === "revealed" && (
                                        <button
                                            onClick={() => handleCopy(key.id)}
                                            className="rounded-md border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                        >
                                            {copiedId === key.id ? "Copied" : "Copy"}
                                        </button>
                                    )}
                                    {canWrite && (
                                        <button
                                            onClick={() => handleDelete(key.id)}
                                            className="rounded-md border border-transparent px-2.5 py-1 text-destructive transition-colors hover:bg-destructive/10"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </section>
    )
}