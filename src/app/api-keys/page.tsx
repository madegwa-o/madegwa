"use client"

import { useState } from "react"
import GlassCard from "@/components/glass-card"

interface ApiKeyEntry {
    id: string
    projectName: string
    keyPreview: string
    updatedLabel: string
}

const ENTRIES: ApiKeyEntry[] = [
    { id: "1", projectName: "AWS logo SVG path", keyPreview: "sk-live-••••7f2a", updatedLabel: "1 hour ago" },
    { id: "2", projectName: "4c hair wave training routine", keyPreview: "sk-live-••••91bd", updatedLabel: "3 days ago" },
    { id: "3", projectName: "JBoss server startup config", keyPreview: "sk-live-••••44e1", updatedLabel: "4 days ago" },
    { id: "4", projectName: "Project Drifer context overview", keyPreview: "sk-live-••••c02f", updatedLabel: "5 days ago" },
    { id: "5", projectName: "Face recognition pipeline", keyPreview: "sk-live-••••8a3d", updatedLabel: "Jul 25" },
    { id: "6", projectName: "Hackathon application", keyPreview: "sk-live-••••2b6c", updatedLabel: "Jul 24" },
]

export default function ApiKeysPage() {
    const [query, setQuery] = useState("")
    const [selectMode, setSelectMode] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const filtered = ENTRIES.filter((e) =>
        e.projectName.toLowerCase().includes(query.toLowerCase())
    )

    function toggleSelected(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <main className="min-h-dvh px-6 py-10 md:px-10">
            <div className="mx-auto max-w-4xl">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <h1 className="text-white text-3xl font-medium">
                        API keys
                    </h1>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <svg
                                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                            >
                                <circle cx="11" cy="11" r="7" />
                                <path d="m21 21-4.3-4.3" />
                            </svg>
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search projects"
                                className="w-48 rounded-full border border-white/10 bg-white/[0.06] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 outline-none backdrop-blur-xl focus:border-white/20"
                            />
                        </div>

                        <button
                            onClick={() => {
                                setSelectMode((v) => !v)
                                setSelected(new Set())
                            }}
                            className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white backdrop-blur-xl transition-colors hover:bg-white/[0.09]"
                        >
                            {selectMode ? "Cancel" : "Select keys"}
                        </button>

                        <button className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90">
                            New project
                        </button>
                    </div>
                </div>

                <GlassCard interactive={false} className="!p-0 overflow-hidden">
                    {filtered.map((entry, i) => (
                        <button
                            key={entry.id}
                            onClick={() =>
                                selectMode
                                    ? toggleSelected(entry.id)
                                    : undefined
                            }
                            className={[
                                "group flex w-full items-center justify-between px-5 py-4 text-left transition-colors",
                                i !== filtered.length - 1
                                    ? "border-b border-white/[0.06]"
                                    : "",
                                "hover:bg-white/[0.05]",
                            ].join(" ")}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {selectMode && (
                                    <span
                                        className={[
                                            "h-4 w-4 shrink-0 rounded-full border",
                                            selected.has(entry.id)
                                                ? "border-[#0022ff] bg-[#0022ff]"
                                                : "border-white/25",
                                        ].join(" ")}
                                    />
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-[15px] text-white">
                                        {entry.projectName}
                                    </p>
                                    <p className="mt-0.5 font-mono text-xs text-white/40">
                                        {entry.keyPreview}
                                    </p>
                                </div>
                            </div>

                            <span className="shrink-0 pl-4 text-xs text-white/40">
                                {entry.updatedLabel}
                            </span>
                        </button>
                    ))}

                    {filtered.length === 0 && (
                        <div className="px-5 py-10 text-center text-sm text-white/40">
                            No projects match "{query}".
                        </div>
                    )}
                </GlassCard>
            </div>
        </main>
    )
}