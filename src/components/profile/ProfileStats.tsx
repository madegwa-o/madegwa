import { formatRelativeTime } from "@/lib/format/date";

interface Stat {
    label: string;
    value: string;
}

export function ProfileStats({
    lastSeen,
    projectCount,
    forkCount,
    keyCount,
}: {
    lastSeen: Date | null;
    projectCount: number;
    forkCount: number;
    keyCount: number;
}) {
    const stats: Stat[] = [
        { label: "Projects", value: projectCount.toLocaleString() },
        { label: "Forks", value: forkCount.toLocaleString() },
        { label: "API Keys", value: keyCount.toLocaleString() },
    ];

    return (
        <div className="flex flex-wrap gap-6 bg-card px-6 pb-5 text-card-foreground">
            <div>
                <span className="text-muted-foreground">Last Seen</span>{" "}
                <span className="font-bold">
                    {lastSeen ? formatRelativeTime(lastSeen) : "—"}
                </span>
            </div>
            {stats.map((stat) => (
                <div key={stat.label}>
                    <span className="font-bold">{stat.value}</span>{" "}
                    <span className="text-muted-foreground">{stat.label}</span>
                </div>
            ))}
        </div>
    );
}
