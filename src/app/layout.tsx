
import './globals.css'
import LogoParticles from "@/components/logo-particles"
import Sidebar from "@/components/sidebar"
import { API_LOGO_PATH } from "@/lib/api-logo-path"
import { KEYS_LOGO_PATH } from "@/lib/keys-logo-path"
import Script from "next/script";

import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import { NotificationDisplay } from "@/components/notifications/notification-display";
import { Toaster } from "sonner"
import { LastSeenPing } from "@/components/LastSeenPing";

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased">
        <AuthProvider>
            <ThemeProvider defaultTheme="system">
                {/*
                  LogoParticles MUST live inside ThemeProvider — it calls
                  useTheme() and needs the real context, not the fallback
                  default. It was previously rendered as a sibling above
                  ThemeProvider, so the toggle never reached it.
                */}
                <LogoParticles
                    logos={[
                        {
                            path: API_LOGO_PATH,
                            color: "#0022ff",
                            height: 100,
                            mobileHeight: 60,
                        },
                        {
                            path: KEYS_LOGO_PATH,
                            color: "#FF9900",
                            height: 100,
                            mobileHeight: 100,
                        },
                    ]}
                    gap={40}
                    mobileGap={20}
                />

                <Suspense fallback={null}>
                    <Toaster />
                    <Sidebar />

                    <div className="relative z-10 pl-16">
                        {children}
                    </div>

                    <Analytics />
                </Suspense>

                <NotificationDisplay />
                <InstallPrompt />
              <MobileBottomNav />
              <LastSeenPing />
            </ThemeProvider>
        </AuthProvider>

        <Script
            id="structured-data"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    name: "Paysuit",
                    applicationCategory: "FinanceApplication",
                    operatingSystem: "Web",
                    description:
                        "Developer-first M-Pesa payments API. Integrate mobile money instantly using secure, modern SDKs.",
                    url: "https://paysuit.aistartupclub.com",
                    creator: {
                        "@type": "Organization",
                        name: "Paysuit Fintech",
                        url: "https://paysuit.aistartupclub.com"
                    }
                }),
            }}
        />
        </body>
        </html>
    );
}
