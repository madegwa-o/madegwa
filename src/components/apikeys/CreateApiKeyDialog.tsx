"use client"

// app/apikeys/CreateApiKeyDialog.tsx
import { useState } from "react"
import { useRouter } from "next/navigation"
import type { ProjectOption } from "@/lib/projects"

interface Props {
    projects: ProjectOption[]
}

export default function CreateApiKeyDialog({ projects }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [projectId, setProjectId] = useState(projects[0]?._id ?? "")
    const [name, setName] = useState("")
    const [scope, setScope] = useState<"READ" | "WRITE">("READ")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [rawKey, setRawKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!projectId) {
            setError("Select a project")
            return
        }
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ projectId, name, scopes: [scope] }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || "Failed to create key")
                return
            }
            setRawKey(data.key.rawKey)
        } catch {
            setError("Failed to create key")
        } finally {
            setLoading(false)
        }
    }

    function handleClose() {
        setOpen(false)
        setName("")
        setScope("READ")
        setRawKey(null)
        setError(null)
        setCopied(false)
        router.refresh() // pick up the new key + keyCount
    }

    async function handleCopy() {
        if (!rawKey) return
        await navigator.clipboard.writeText(rawKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                disabled={projects.length === 0}
                className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
                New key
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
                        {!rawKey ? (
                            <form onSubmit={handleCreate}>
                                <h2 className="mb-4 text-lg font-semibold">New API key</h2>

                                <label className="mb-1 block text-sm font-medium">Project</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="mb-4 w-full rounded-md border px-3 py-2 text-sm"
                                >
                                    {projects.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>

                                <label className="mb-1 block text-sm font-medium">Name</label>
                                <input
                                    autoFocus
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. prod-server-1"
                                    className="mb-4 w-full rounded-md border px-3 py-2 text-sm"
                                />

                                <label className="mb-1 block text-sm font-medium">Scope</label>
                                <select
                                    value={scope}
                                    onChange={(e) => setScope(e.target.value as "READ" | "WRITE")}
                                    className="mb-4 w-full rounded-md border px-3 py-2 text-sm"
                                >
                                    <option value="READ">Read</option>
                                    <option value="WRITE">Write</option>
                                </select>

                                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

                                <div className="flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {loading ? "Creating..." : "Create key"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div>
                                <h2 className="text-lg font-semibold">Key created</h2>
                                <p className="mb-3 text-sm text-amber-700">
                                    Copy this now — you won&apos;t be able to see it again.
                                </p>
                                <div className="mb-4 flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2">
                                    <code className="flex-1 overflow-x-auto text-sm">{rawKey}</code>
                                    <button
                                        onClick={handleCopy}
                                        className="shrink-0 rounded-md border px-2 py-1 text-xs hover:bg-gray-100"
                                    >
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleClose}
                                        className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}