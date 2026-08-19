import Link from "next/link";
import type { ProfileProjectSummary } from "@/lib/profile/data";
import { formatDate } from "@/lib/format/date";

export function ProjectCard({ project }: { project: ProfileProjectSummary }) {
    return (
        <Link
            href={`/projects/${project._id}`}
            className="block border-b border-border p-5 transition-colors hover:bg-muted/50"
        >
            <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{project.name}</span>
                <span
                    className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                        project.visibility === "PUBLIC"
                            ? "border-primary/40 text-primary"
                            : "border-border text-muted-foreground"
                    }`}
                >
                    {project.visibility}
                </span>
                {project.forkedFrom && (
                    <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                        forked
                    </span>
                )}
            </div>

            <div className="mt-2 flex gap-4 font-mono text-xs text-muted-foreground">
                <span>{project.keyCount} {project.keyCount === 1 ? "key" : "keys"}</span>
                <span>{project.forkCount} {project.forkCount === 1 ? "fork" : "forks"}</span>
                <span>updated {formatDate(project.updatedAt)}</span>
            </div>
        </Link>
    );
}