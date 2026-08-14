"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { JSX, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useTheme } from "@/components/theme-provider"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

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

function IconDownload({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="M12 3v12M7 10l5 5 5-5" />
            <path d="M4 19h16" />
        </svg>
    )
}

function IconSunMoon({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    )
}

function IconUser({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
        </svg>
    )
}

function IconLogOut({ className }: { className?: string }) {
    return (
        <svg className={className} {...ICON_PROPS}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
    )
}

const NAV_ITEMS: NavItem[] = [
    { id: "keys", label: "API keys", href: "/", icon: IconKey },
    { id: "projects", label: "Projects", href: "/projects", icon: IconFolder },
    { id: "environments", label: "Environments", href: "/environments", icon: IconLayers },
    { id: "docs", label: "Docs & snippets", href: "/docs", icon: IconCode },
    { id: "team", label: "Team", href: "/team", icon: IconBriefcase },
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
                    active
                        ? "text-accent-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                ].join(" ")}
            />

            {badge && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}

            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-border bg-popover/90 backdrop-blur-md px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                {label}
            </span>
        </>
    )

    const className = [
        "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        active ? "bg-accent" : "hover:bg-accent/60",
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

function getUserInitials(name: string | null | undefined) {
    if (!name) return "U"
    const names = name.split(" ")
    if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
}

function AccountMenu() {
    const { data: session, status } = useSession()

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" })
    }

    if (status === "loading") {
        return <div className="h-9 w-9 rounded-full bg-accent animate-pulse" />
    }

    if (!session?.user) {
        return (
            <Link
                href="/auth/login"
                aria-label="Sign in"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-accent/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <IconUser className="h-4 w-4" />
            </Link>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    aria-label="Account"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-accent/60 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent"
                >
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"} />
                        <AvatarFallback className="bg-transparent text-accent-foreground">
                            {getUserInitials(session.user.name)}
                        </AvatarFallback>
                    </Avatar>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-56 glass">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer">
                        <IconUser className="mr-2 h-4 w-4" />
                        My Account
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer text-destructive focus:text-destructive"
                >
                    <IconLogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const { theme, setTheme } = useTheme()

    if (collapsed) {
        return (
            <button
                onClick={() => setCollapsed(false)}
                aria-label="Expand sidebar"
                className="fixed left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-lg glass-solid text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
                <IconPanel className="h-4.5 w-4.5" />
            </button>
        )
    }

    return (
        <aside className="fixed left-0 top-0 z-20 flex h-dvh w-16 flex-col items-center glass-solid py-3">
            <button
                onClick={() => setCollapsed(true)}
                aria-label="Collapse sidebar"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
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

                <RailButton
                    icon={IconSunMoon}
                    label="Toggle theme"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                />

                <div className="my-2 h-px w-8 bg-border" />

                <AccountMenu />
            </div>
        </aside>
    )
}