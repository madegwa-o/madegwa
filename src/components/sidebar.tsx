"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {JSX, useState} from "react"

interface NavItem {
    id: string
    label: string
    href: string
    icon: (props: { className?: string }) => JSX.Element
}

const ICON_PROPS = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
}

function IconPanel({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M9 4v16" />
        </svg>
    )
}

function IconPlus({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="M12 5v14M5 12h14" />
        </svg>
    )
}

function IconKey({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <circle cx="8" cy="15" r="4" />
            <path d="M11 12 20 3M16 4l3 3M13 7l3 3" />
        </svg>
    )
}

function IconFolder({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        </svg>
    )
}

function IconLayers({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="m12 3 9 5-9 5-9-5Z" />
            <path d="m3 13 9 5 9-5" />
        </svg>
    )
}

function IconCode({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
        </svg>
    )
}

function IconBriefcase({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    )
}

function IconPalette({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <circle cx="12" cy="12" r="9" />
            <circle cx="8.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="8" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
            <path d="M12 21a9 9 0 0 1 0-18c1 3 3 2 3 5s-3 3-3 6 3 3 0 7Z" />
        </svg>
    )
}

function IconDownload({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="M12 3v12M7 10l5 5 5-5" />
            <path d="M4 19h16" />
        </svg>
    )
}

const NAV_ITEMS: NavItem[] = [
    { id: "keys", label: "API keys", href: "/", icon: IconKey },
    { id: "projects", label: "Projects", href: "/projects", icon: IconFolder },
    { id: "environments", label: "Environments", href: "/environments", icon: IconLayers },
    { id: "docs", label: "Docs & snippets", href: "/docs", icon: IconCode },
    { id: "team", label: "Team", href: "/team", icon: IconBriefcase },
    { id: "appearance", label: "Appearance", href: "/appearance", icon: IconPalette },
]

function RailButton({
                        icon: Icon,
                        label,
                        active = false,
                        onClick,
                        href,
                        badge,
                    }: {
    icon: (props: { className?: string }) => JSX.Element
    label: string
    active?: boolean
    onClick?: () => void
    href?: string
    badge?: boolean
}) {
    const content = (
        <>
            <Icon
                className={[
                    "h-5 w-5 transition-colors",
                    active ? "text-white" : "text-white/70 group-hover:text-white",
                ].join(" ")}
            />

            {badge && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#0022ff]" />
            )}

            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-xs text-white opacity-0 backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100">
                {label}
            </span>
        </>
    )

    const className = [
        "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        active ? "bg-white/10" : "hover:bg-white/[0.07]",
    ].join(" ")

    if (href) {
        return (
            <Link href={href} className={className} aria-label={label}>
                {content}
            </Link>
        )
    }

    return (
        <button onClick={onClick} className={className} aria-label={label}>
            {content}
        </button>
    )
}

export default function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="fixed left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 backdrop-blur-xl transition-colors hover:bg-white/[0.1] hover:text-white"
            >
                <IconPanel className="h-4.5 w-4.5" />
            </button>
        )
    }

    return (
        <aside className="fixed left-0 top-0 z-20 flex h-dvh w-16 flex-col items-center border-r border-white/10 bg-white/[0.04] py-3 backdrop-blur-xl">
            <button
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white"
            >
                <IconPanel className="h-4.5 w-4.5" />
            </button>

            <div className="mt-4">
                <RailButton icon={IconPlus} label="New key" onClick={() => {}} />
            </div>

            <nav className="mt-2 flex flex-col items-center gap-1">
                {NAV_ITEMS.map((item) => (
                    <RailButton
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        href={item.href}
                        active={pathname === item.href}
                    />
                ))}
            </nav>

            <div className="mt-auto flex flex-col items-center gap-1">
                <RailButton icon={IconDownload} label="Export keys" onClick={() => {}} badge />

                <div className="my-2 h-px w-8 bg-white/10" />

                <button
                    aria-label="Account"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-xs font-medium text-white transition-colors hover:bg-white/[0.14]"
                >
                    JD
                </button>
            </div>
        </aside>
    )
}