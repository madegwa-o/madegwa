"use client";

import { Wallet2, ReceiptText, UserCircle2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const tabs = [
        {
            href: "/directpaywall",
            icon: Wallet2, // Represents your M-Pesa directpaywall
            label: "Wallet",
        },
        {
            href: "/transactions",
            icon: ReceiptText, // For receipts and payment history
            label: "Transactions",
        },
        {
            href: "/account",
            icon: UserCircle2, // For user profile & account settings
            label: "Account",
        },
    ];

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 80) setIsVisible(false);
            else setIsVisible(true);
            setLastScrollY(currentScrollY);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const isActive = (href: string) => pathname?.startsWith(href);

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
                isVisible ? "translate-y-0" : "translate-y-full"
            }`}
            style={{
                background: "var(--surface)",
                borderTop: "1px solid var(--border)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            <div className="flex items-center justify-around h-16 px-4 max-w-md mx-auto">
                {tabs.map((tab) => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex flex-col items-center justify-center flex-1 h-full relative group"
                        >
                            {active && (
                                <div
                                    className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-12 rounded-full"
                                    style={{
                                        background: "var(--foreground)",
                                        animation: "slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                    }}
                                />
                            )}
                            <div
                                className={`flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                                    active ? "scale-105" : "group-hover:scale-105"
                                }`}
                                style={{
                                    background: active ? "var(--surface-secondary)" : "transparent",
                                }}
                            >
                                <tab.icon
                                    className={`w-6 h-6 transition-all duration-200 ${
                                        active ? "" : "group-hover:scale-110"
                                    }`}
                                    style={{
                                        color: active ? "var(--foreground)" : "var(--text-secondary)",
                                        strokeWidth: active ? 2.5 : 2,
                                    }}
                                />
                            </div>
                            <span
                                className={`text-xs mt-1 font-medium transition-all duration-200 ${
                                    active ? "opacity-100" : "opacity-60"
                                }`}
                                style={{
                                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                                }}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
