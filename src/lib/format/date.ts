/** "Aug 19, 2026" — deliberately absolute, not relative ("2h ago"), so it's honest at a glance and never needs a live-updating client component. */
export function formatDate(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}