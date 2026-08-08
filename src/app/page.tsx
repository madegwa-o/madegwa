"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Folder, Plus, Globe2, LockKeyhole, ArrowUpRight, KeyRound } from "lucide-react"

interface Project { _id: string; name: string; visibility: "public" | "private"; createdAt: string; keyCount: number; role: string }

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [name, setName] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState("")

  const load = () => fetch("/api/projects").then((res) => res.ok ? res.json() : []).then(setProjects)
  useEffect(() => { load() }, [])
  async function createProject(event: React.FormEvent) {
    event.preventDefault(); setError("")
    const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, visibility }) })
    if (!response.ok) { setError((await response.json()).error || "Unable to create project"); return }
    setName(""); setShowCreate(false); load()
  }

  return <main className="min-h-dvh bg-background px-8 py-12 text-foreground lg:px-16">
    <div className="mx-auto max-w-6xl">
      <header className="mb-12 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">Secure workspace</p><h1 className="text-4xl font-semibold tracking-tight">Projects</h1><p className="mt-3 max-w-xl text-muted-foreground">Organize API credentials by product, environment, and team access.</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"><Plus data-icon="inline-start" /> New project</button>
      </header>
      {showCreate && <form onSubmit={createProject} className="mb-8 grid gap-4 rounded-lg border border-border bg-card p-5 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="grid gap-2 text-sm"><span className="text-muted-foreground">Project name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Checkout API" className="rounded-md border border-input bg-background px-3 py-2 outline-none ring-primary focus:ring-2" /></label><label className="grid gap-2 text-sm"><span className="text-muted-foreground">Visibility</span><select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "public")} className="rounded-md border border-input bg-background px-3 py-2"><option value="private">Private</option><option value="public">Public</option></select></label><button className="rounded-md bg-secondary px-4 py-2 font-medium text-secondary-foreground">Create</button>{error && <p className="text-sm text-destructive sm:col-span-3">{error}</p>}</form>}
      {projects.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center"><Folder className="mb-4 text-muted-foreground" /><h2 className="font-medium">No projects yet</h2><p className="mt-2 text-sm text-muted-foreground">Create your first project to start storing keys.</p></div> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <Link key={project._id} href={`/projects/${project._id}`} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/60"><div className="flex items-start justify-between"><div className="rounded-md border border-border bg-background p-2"><Folder className="text-primary" /></div><ArrowUpRight className="text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div><h2 className="mt-6 text-lg font-medium">{project.name}</h2><div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1">{project.visibility === "public" ? <Globe2 /> : <LockKeyhole />}{project.visibility}</span><span className="inline-flex items-center gap-1"><KeyRound />{project.keyCount} keys</span></div><div className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">{project.role === "admin" ? "Admin" : project.role} · {new Date(project.createdAt).toLocaleDateString()}</div></Link>)}</div>}
    </div>
  </main>
}
