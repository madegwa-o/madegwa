"use client"

import { useState } from "react"

type Member = {
    userId: string
    email: string
    name: string
    role: "read" | "write"
}

export default function MembersPanel({
                                         projectId,
                                         initialMembers,
                                         isOwner,
                                         currentUserId,
                                     }: {
    projectId: string
    initialMembers: Member[]
    isOwner: boolean
    currentUserId: string
}) {
    const [members, setMembers] = useState(initialMembers)
    const [showInvite, setShowInvite] = useState(false)
    const [email, setEmail] = useState("")
    const [role, setRole] = useState<"read" | "write">("read")
    const [inviting, setInviting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) {
            setError("Enter an email")
            return
        }

        setInviting(true)
        setError(null)

        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), role }),
            })

            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.error ?? "Couldn't add that person")
            }

            const data = await res.json()
            setMembers(data.members)
            setEmail("")
            setShowInvite(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add that person")
        } finally {
            setInviting(false)
        }
    }

    async function handleRoleChange(userId: string, newRole: "read" | "write") {
        const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole }),
        })
        if (res.ok) {
            setMembers((m) => m.map((row) => (row.userId === userId ? { ...row, role: newRole } : row)))
        }
    }

    async function handleRemove(userId: string) {
        const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: "DELETE" })
        if (res.ok) {
            setMembers((m) => m.filter((row) => row.userId !== userId))
        }
    }

    return (
        <aside className="glass rounded-lg p-6">
            <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-medium">Members</h2>
                {isOwner && (
                    <button
                        onClick={() => setShowInvite((s) => !s)}
                        className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        {showInvite ? "Cancel" : "Invite"}
                    </button>
                )}
            </div>

            {showInvite && (
                <form
                    onSubmit={handleInvite}
                    className="mb-6 grid gap-3 rounded-md border border-border bg-background/60 backdrop-blur-md p-4"
                >
                    <input
                        placeholder="person@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        autoFocus
                        className="rounded-md border border-input bg-background/60 px-3 py-2 text-sm outline-none ring-primary focus:ring-2"
                    />

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setRole("read")}
                            className={[
                                "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                                role === "read"
                                    ? "border-primary bg-accent text-accent-foreground"
                                    : "border-border text-muted-foreground hover:bg-accent/60",
                            ].join(" ")}
                        >
                            Read
                        </button>
                        <button
                            type="button"
                            onClick={() => setRole("write")}
                            className={[
                                "flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors",
                                role === "write"
                                    ? "border-primary bg-accent text-accent-foreground"
                                    : "border-border text-muted-foreground hover:bg-accent/60",
                            ].join(" ")}
                        >
                            Write
                        </button>
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <button
                        type="submit"
                        disabled={inviting}
                        className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                        {inviting ? "Adding…" : "Add member"}
                    </button>
                </form>
            )}

            <ul className="divide-y divide-border">
                {members.length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">No other members.</p>
                )}
                {members.map((member) => (
                    <li key={member.userId} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">{member.name || member.email}</span>
                            <span className="truncate text-xs text-muted-foreground">{member.email}</span>
                        </div>

                        {isOwner ? (
                            <div className="flex shrink-0 items-center gap-2">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.userId, e.target.value as "read" | "write")}
                                    className="rounded-md border border-input bg-background/60 px-2 py-1 text-xs outline-none ring-primary focus:ring-2"
                                >
                                    <option value="read">Read</option>
                                    <option value="write">Write</option>
                                </select>
                                <button
                                    onClick={() => handleRemove(member.userId)}
                                    className="rounded-md border border-transparent px-2 py-1 text-xs text-destructive transition-colors hover:bg-destructive/10"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <span className="shrink-0 rounded-full border border-border bg-accent/60 px-2 py-0.5 text-xs text-accent-foreground">
                                {member.role}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </aside>
    )
}