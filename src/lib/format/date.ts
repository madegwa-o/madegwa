// lib/format/date.ts

/** "Aug 19, 2026" — deliberately absolute, not relative, so it's honest at a glance and never needs a live-updating client component. */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * "Last Seen"-style formatting: relative for anything recent, a bare time
 * for today, and a short date once it's far enough back that "3 days ago"
 * stops being more useful than just the date. Computed once per render
 * from a server-provided Date — no client-side ticking clock needed.
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24 && isSameDay(d, now)) {
        // Within the same calendar day — show a clock time, e.g. "2:45 PM"
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    if (diffHour < 48) return "Yesterday";
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    // Far enough back that a relative label isn't meaningfully more useful
    return formatDate(d);
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
