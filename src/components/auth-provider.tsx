// Updated components/auth-provider.tsx
'use client'

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { NotificationProvider } from "@/components/notifications/notification-context";

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <NotificationProvider>
                {children}
            </NotificationProvider>
        </SessionProvider>
    );
}