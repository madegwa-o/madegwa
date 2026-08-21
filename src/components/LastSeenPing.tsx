// components/LastSeenPing.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function LastSeenPing() {
    const { status } = useSession();

    useEffect(() => {
        if (status !== "authenticated") return;

        const ping = () => {
            fetch("/api/user/ping", { method: "POST" }).catch(() => {
                // silently ignore — a missed heartbeat isn't worth surfacing
            });
        };

        ping(); // fire once on mount (covers "just logged in" / fresh page load)
        const interval = setInterval(ping, PING_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [status]);

    return null;
}
